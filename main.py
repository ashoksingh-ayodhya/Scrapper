#!/usr/bin/env python3
"""Command-line interface for the Scrapper project.

Provides two sub-commands:

    python main.py facebook <post_url> [options]
    python main.py google-maps <place_url_or_query> [options]
"""

import argparse
import logging
import sys


def _run_facebook(args: argparse.Namespace) -> None:
    from facebook_scraper.comments_scraper import FacebookCommentsScraper

    scraper = FacebookCommentsScraper(
        headless=not args.no_headless,
        scroll_pause=args.scroll_pause,
        max_comment_loads=args.max_loads,
    )
    try:
        comments = scraper.scrape(args.url)
        if not comments:
            print("No comments found.")
            return

        print(f"Scraped {len(comments)} comment(s).")

        if args.output.endswith(".json"):
            scraper.save_to_json(comments, args.output)
        else:
            scraper.save_to_csv(comments, args.output)

        print(f"Results saved to {args.output}")
    finally:
        scraper.close()


def _run_google_maps(args: argparse.Namespace) -> None:
    from google_maps_scraper.reviews_scraper import GoogleMapsReviewsScraper

    scraper = GoogleMapsReviewsScraper(
        headless=not args.no_headless,
        scroll_pause=args.scroll_pause,
        max_scrolls=args.max_scrolls,
    )
    try:
        if args.url.startswith("http"):
            reviews = scraper.scrape(args.url)
        else:
            # Treat as a search query
            reviews = scraper.scrape_by_search(args.url)

        if not reviews:
            print("No reviews found.")
            return

        print(f"Scraped {len(reviews)} review(s).")

        if args.output.endswith(".json"):
            scraper.save_to_json(reviews, args.output)
        else:
            scraper.save_to_csv(reviews, args.output)

        print(f"Results saved to {args.output}")
    finally:
        scraper.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Scrape Facebook comments or Google Maps reviews.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose (DEBUG) logging.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # ---- Facebook sub-command ----
    fb_parser = subparsers.add_parser(
        "facebook",
        help="Scrape comments and replies from a Facebook post.",
    )
    fb_parser.add_argument(
        "url",
        help="URL of the Facebook post to scrape.",
    )
    fb_parser.add_argument(
        "-o", "--output",
        default="facebook_comments.csv",
        help="Output file path (CSV or JSON). Default: facebook_comments.csv",
    )
    fb_parser.add_argument(
        "--no-headless",
        action="store_true",
        help="Show the browser window (disable headless mode).",
    )
    fb_parser.add_argument(
        "--scroll-pause",
        type=float,
        default=2.0,
        help="Seconds to pause between actions. Default: 2.0",
    )
    fb_parser.add_argument(
        "--max-loads",
        type=int,
        default=50,
        help="Max times to click 'View more comments'. Default: 50",
    )
    fb_parser.set_defaults(func=_run_facebook)

    # ---- Google Maps sub-command ----
    gm_parser = subparsers.add_parser(
        "google-maps",
        help="Scrape reviews for a Google Maps business.",
    )
    gm_parser.add_argument(
        "url",
        help=(
            "Google Maps place URL or a search query "
            "(e.g. 'Pizza Hut New York')."
        ),
    )
    gm_parser.add_argument(
        "-o", "--output",
        default="google_maps_reviews.csv",
        help="Output file path (CSV or JSON). Default: google_maps_reviews.csv",
    )
    gm_parser.add_argument(
        "--no-headless",
        action="store_true",
        help="Show the browser window (disable headless mode).",
    )
    gm_parser.add_argument(
        "--scroll-pause",
        type=float,
        default=2.0,
        help="Seconds to pause between scroll actions. Default: 2.0",
    )
    gm_parser.add_argument(
        "--max-scrolls",
        type=int,
        default=100,
        help="Max number of scroll actions in the reviews panel. Default: 100",
    )
    gm_parser.set_defaults(func=_run_google_maps)

    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    args.func(args)


if __name__ == "__main__":
    main()
