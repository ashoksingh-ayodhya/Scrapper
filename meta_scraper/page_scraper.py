"""Facebook / Meta Page Scraper.

Scrapes posts, comments, and replies from a public Facebook page using
the `facebook-scraper` library (no browser required).

Usage:
    from meta_scraper.page_scraper import MetaPageScraper

    scraper = MetaPageScraper(months=12)
    results = scraper.scrape_page("C3Pay")
    scraper.save_to_csv(results, "c3pay_comments.csv")
"""

import csv
import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)


@dataclass
class Reply:
    author: str = ""
    text: str = ""
    timestamp: str = ""


@dataclass
class Comment:
    author: str = ""
    text: str = ""
    timestamp: str = ""
    replies: list[Reply] = field(default_factory=list)


@dataclass
class PostWithComments:
    post_url: str = ""
    post_text: str = ""
    post_timestamp: str = ""
    comments: list[Comment] = field(default_factory=list)


class MetaPageScraper:
    """Scrape posts, comments and replies from a public Facebook page.

    Parameters
    ----------
    months : int
        Only include posts from the last *months* months (default 12).
    pages : int
        Max timeline pages to fetch (~10 posts each). Default 100.
    cookies : str | None
        Path to a Netscape-format cookies.txt file for authenticated
        scraping. Optional — public pages work without it.
    """

    def __init__(
        self,
        *,
        months: int = 12,
        pages: int = 100,
        cookies: str | None = None,
    ) -> None:
        self.months = months
        self.pages = pages
        self.cookies = cookies
        self._cutoff = datetime.now(tz=timezone.utc) - timedelta(days=months * 30)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def scrape_page(self, page_id: str) -> list[PostWithComments]:
        """Scrape posts + comments from *page_id* (name or numeric ID).

        Returns a list of PostWithComments for posts within the last
        *months* months.
        """
        try:
            from facebook_scraper import get_posts  # pip: facebook-scraper
        except ImportError:
            raise RuntimeError(
                "facebook-scraper is not installed. "
                "Run: pip3 install facebook-scraper"
            )

        page_id = self._normalise_page_id(page_id)
        logger.info("Scraping page '%s' (last %d months)", page_id, self.months)

        options = {
            "comments": True,
            "comments_pagination": True,
            "allow_extra_requests": True,
            "reactions": False,
        }
        kwargs: dict = {
            "pages": self.pages,
            "options": options,
            "timeout": 30,
        }
        if self.cookies:
            kwargs["cookies"] = self.cookies

        results: list[PostWithComments] = []
        total_posts = 0

        try:
            for raw in get_posts(page_id, **kwargs):
                post_time = raw.get("time")

                if post_time and post_time.tzinfo is None:
                    post_time = post_time.replace(tzinfo=timezone.utc)

                # Posts come newest-first; stop when we pass the cutoff
                if post_time and post_time < self._cutoff:
                    logger.info(
                        "Reached posts older than %d months — stopping.",
                        self.months,
                    )
                    break

                total_posts += 1
                post = self._build_post(raw)
                results.append(post)
                logger.info(
                    "Post %d  [%s]  %d comment(s)",
                    total_posts,
                    post.post_timestamp,
                    len(post.comments),
                )

        except Exception as exc:
            logger.error("Error while fetching posts: %s", exc)
            if not results:
                raise

        logger.info(
            "Done: %d post(s), %d comment(s), %d reply/replies",
            len(results),
            sum(len(p.comments) for p in results),
            sum(sum(len(c.replies) for c in p.comments) for p in results),
        )
        return results

    # ------------------------------------------------------------------
    # Output helpers
    # ------------------------------------------------------------------

    @staticmethod
    def save_to_csv(results: list[PostWithComments], filepath: str) -> None:
        """Save posts, comments, and replies to a flat CSV."""
        with open(filepath, "w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh)
            writer.writerow([
                "post_url", "post_text_preview", "post_timestamp",
                "type", "author", "text", "timestamp", "parent_author",
            ])
            for post in results:
                preview = (
                    (post.post_text[:100] + "…")
                    if len(post.post_text) > 100
                    else post.post_text
                )
                if not post.comments:
                    writer.writerow([
                        post.post_url, preview, post.post_timestamp,
                        "post", "", post.post_text, post.post_timestamp, "",
                    ])
                for comment in post.comments:
                    writer.writerow([
                        post.post_url, preview, post.post_timestamp,
                        "comment", comment.author, comment.text,
                        comment.timestamp, "",
                    ])
                    for reply in comment.replies:
                        writer.writerow([
                            post.post_url, preview, post.post_timestamp,
                            "reply", reply.author, reply.text,
                            reply.timestamp, comment.author,
                        ])
        logger.info("Saved results to %s", filepath)

    @staticmethod
    def save_to_json(results: list[PostWithComments], filepath: str) -> None:
        """Save posts, comments, and replies to JSON."""
        def _serial(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            raise TypeError(f"Not serialisable: {type(obj)}")

        data = [asdict(p) for p in results]
        with open(filepath, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2, default=_serial)
        logger.info("Saved results to %s", filepath)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _normalise_page_id(page_id: str) -> str:
        """Strip facebook.com URL down to just the page name/id."""
        for prefix in (
            "https://www.facebook.com/",
            "https://m.facebook.com/",
            "https://mbasic.facebook.com/",
            "http://www.facebook.com/",
        ):
            if page_id.startswith(prefix):
                page_id = page_id[len(prefix):]
        return page_id.strip("/").split("?")[0].split("/")[0]

    def _build_post(self, raw: dict) -> PostWithComments:
        """Convert a raw facebook-scraper post dict to PostWithComments."""
        ts = raw.get("time")
        ts_str = ts.isoformat() if ts else raw.get("timestamp", "")

        post = PostWithComments(
            post_url=raw.get("post_url", raw.get("link", "")),
            post_text=raw.get("text", raw.get("post_text", "")),
            post_timestamp=ts_str,
        )

        for rc in raw.get("comments_full") or []:
            comment = self._build_comment(rc)
            if comment.text or comment.author:
                post.comments.append(comment)

        return post

    @staticmethod
    def _build_comment(rc: dict) -> Comment:
        """Convert a raw comment dict to a Comment dataclass."""
        ct = rc.get("comment_time")
        ct_str = ct.isoformat() if isinstance(ct, datetime) else str(ct or "")

        comment = Comment(
            author=rc.get("commenter_name", ""),
            text=rc.get("comment_text", ""),
            timestamp=ct_str,
        )

        for rr in rc.get("replies", []) or []:
            rt = rr.get("comment_time")
            rt_str = rt.isoformat() if isinstance(rt, datetime) else str(rt or "")
            reply = Reply(
                author=rr.get("commenter_name", ""),
                text=rr.get("comment_text", ""),
                timestamp=rt_str,
            )
            if reply.text or reply.author:
                comment.replies.append(reply)

        return comment
