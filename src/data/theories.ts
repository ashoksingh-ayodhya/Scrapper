import type { Accent } from '@/lib/accents';

// 100% OF TEXT CONTENT GOES HERE. NO HARDCODING IN COMPONENTS.

export interface TheoryDeepDive {
  physics: string;
  scenario: string;
  agencyGuess: string;
  agencyComicPrompt: string;
  physicistRealignment: string;
  physicistComicPrompt: string;
  translation: string;
}

export interface Theory {
  id: string;
  index: string;
  scale: string;
  accent: Accent;
  title: string;
  formula: string;
  copy: string;
  visualComponent: string;
  deepDive: TheoryDeepDive;
}

export const theories: Theory[] = [
  {
    id: 'gravitational-funnel',
    index: '01',
    scale: 'COSMIC',
    accent: 'solar',
    title: 'The bigger your brand mass, the less force you need to close.',
    formula: 'F = G · m₁m₂ / r²',
    copy: "Hundreds of leads orbit a central conversion mass. Grab the mass with your cursor and watch the orbits decay. The retargeting ring lights up at perigee — every customer's closest pass.",
    visualComponent: 'GravityFunnel',
    deepDive: {
      physics:
        "Newton's law of universal gravitation states that every particle attracts every other particle with a force directly proportional to the product of their masses and inversely proportional to the square of the distance between them.",
      scenario:
        'Commercial B2B Laundry & Linen Supply in Dubai. The city has extreme premium hotel density. Operations require strict SLAs. You are facing a massive churn rate because competitors are undercutting you by a few dirhams per kilo. Your sales cycle is outbound, cold, and takes 18 months.',
      agencyGuess:
        "A standard agency will tell you to spin up a Google Search campaign for 'commercial laundry services Dubai' and build a landing page offering '20% off your first 3 months.' They launch the ads, look at the CTR, and call it a day.",
      agencyComicPrompt:
        "[AI VISUAL COMMAND: AGENCY COMIC - Flat vector. Trendy marketing bro in a pristine Dubai cafe pointing to a whiteboard with a massive '20% OFF' coupon. Hotel manager looking exhausted in the background. Speech bubble: 'Let's buy more keywords!']",
      physicistRealignment:
        'Procurement managers at 5-star hotels do not care about a 20% discount. If a guest finds a stain, they lose their job. They care about linen degradation rates and emergency turnaround times. We kill the discount landing page entirely. We build targeted, highly technical content mapping out exact fabric lifespans (building your Mass). We map out the exact contract renewal dates for the top 50 hotels in the city. We deploy a highly concentrated Account-Based Marketing (ABM) retargeting sequence specifically to those decision-makers exactly 90 days before their current contracts expire. You are not chasing them; you are pulling them in.',
      physicistComicPrompt:
        "[AI VISUAL COMMAND: PHYSICIST COMIC - Sleek dark mode. Sharp strategist in a dark control room holding a sniper rifle that shoots highly targeted whitepapers at 50 glowing dots. Caption: 'Mass attracts mass. We wait until they enter our orbit.']",
      translation:
        "Your technical authority is your 'Mass' (m₁). A 20% discount coupon has zero mass. Distance (r²) is the time until the client's contract renewal. Gravity weakens exponentially with distance. If you market to a hotel 12 months before their renewal, your force (F) is near zero. If you deploy aggressive ABM targeting at the exact moment they enter the 90-day renewal window (their 'perigee'), the gravitational pull becomes inescapable.",
    },
  },
  {
    id: 'markov-attribution',
    index: '02',
    scale: 'NETWORK',
    accent: 'acid',
    title: 'Every channel is worth what disappears when you remove it.',
    formula: 'Δ(C) = P(c) − P(c | C removed)',
    copy: 'Channels become nodes, traffic becomes light. Click any node to dim it and watch the whole graph recompute conversion probability live. Attribution as physics, not as a pie chart.',
    visualComponent: 'MarkovGraph',
    deepDive: {
      physics:
        "A Markov chain models the probabilities of transitioning from one state to another. Removal effect calculates a node's true value by measuring the collapse in total network probability if that node ceases to exist.",
      scenario:
        'Mobile Money Fintech in Accra, Ghana. You are acquiring unbanked merchants, but your Customer Acquisition Cost (CAC) is bleeding out. You are running field agents, SMS blasts, and Meta ads.',
      agencyGuess:
        "The agency logs into Google Analytics. Meta Ads is taking the last-click credit for 80% of signups. They tell you to cut the 'ineffective' SMS and field-marketing budgets entirely and dump everything into Meta to scale.",
      agencyComicPrompt:
        "[AI VISUAL COMMAND: AGENCY COMIC - Flat vector. Agency guy staring obsessively at a MacBook screen displaying a giant pie chart labeled 'META ADS,' while ignoring a massive crowd of real people using flip-phones outside his window.]",
      physicistRealignment:
        'We map the actual user journey using a Markov chain graph. The data reveals that Meta Ads is just the net catching the fish. The intent was actually generated by a localized SMS blast three days prior, which sparked a WhatsApp conversation with a field agent, which led them to search and click the Meta ad. If you cut the SMS budget, the Meta ads will instantly stop converting.',
      physicistComicPrompt:
        "[AI VISUAL COMMAND: PHYSICIST COMIC - Glowing web of nodes over a market. Marketer unplugs the 'SMS' node, and the entire bridge collapses, leaving the 'Facebook' node isolated.]",
      translation:
        "You measure a channel's value by what disappears when you remove it. If you remove the SMS node (C), the entire network's probability of closing a deal (P(c)) drops by 60%. Facebook gets the dashboard credit, but SMS built the structural bridge.",
    },
  },
  {
    id: 'lorenz-chaos',
    index: '03',
    scale: 'ATMOSPHERIC',
    accent: 'acid',
    title: 'Two campaigns, one decimal apart, end up in different universes.',
    formula: 'dx/dt = σ(y−x)',
    copy: "The Lorenz attractor drawn live by two near-identical campaigns. Nudge a seed by 0.0001 and watch the ribbons tear apart. Why your A/B test 'didn't replicate'.",
    visualComponent: 'LorenzChaos',
    deepDive: {
      physics:
        'The Butterfly Effect. In chaotic deterministic systems, infinitesimally small changes in initial conditions result in vastly different outcomes, making long-term prediction impossible.',
      scenario:
        'Heavily-funded DTC E-commerce Brand in the US. Last quarter, a specific ad creative absolutely crushed it. CPA was at an all-time low. You replicate the exact same campaign this quarter, with the exact same budget and targeting, and it completely bombs. ROAS falls off a cliff.',
      agencyGuess:
        "The agency panics. They tell you the creative is 'burned out.' They suggest aggressively duplicating the underperforming ad sets, pumping the budget by 20% to 'force the algorithm to learn,' and rapidly A/B testing 15 new button colors on the landing page.",
      agencyComicPrompt:
        "[AI VISUAL COMMAND: AGENCY COMIC - Two panicked marketers in a burning office. One hits a giant red 'DUPLICATE AD SET' button, the other paints a 'BUY NOW' button lighter blue.]",
      physicistRealignment:
        "Stop touching the budget and stop duplicating the ad sets. The initial campaign succeeded because of a specific cultural micro-trend that week and a lack of competitor bidding on a key secondary platform. The digital ecosystem is not static. Duplicating the ad set reset the machine learning phase under completely different macroeconomic conditions. The 'seed' was altered. We map the new attractor instead of forcing the old one.",
      physicistComicPrompt:
        '[AI VISUAL COMMAND: PHYSICIST COMIC - Calm observer watching a digital butterfly flap its wings, causing a massive storm on the other side of the room.]',
      translation:
        'In the Lorenz equations, a microscopic nudge to a starting seed tears the ribbons apart. In performance marketing, a 0.001 change in the bidding environment, a slight shift in audience overlap, or a one-day delay in launch creates an entirely different algorithmic trajectory. You cannot force a chaotic system; you can only ride the new vector.',
    },
  },
  {
    id: 'mandelbrot-economics',
    index: '04',
    scale: 'FRACTAL',
    accent: 'magenta',
    title: 'Your unit economics are a point on a fractal.',
    formula: 'z → z² + c',
    copy: "Drag and zoom into the Mandelbrot set. Some coordinates stay bounded forever — that's a sustainable business. Step one pixel out and you diverge to infinity.",
    visualComponent: 'MandelbrotEconomics',
    deepDive: {
      physics:
        'The Mandelbrot set iterates a complex quadratic polynomial. Points within the set remain bounded (stable) when iterated to infinity. Points outside the set escape to infinity (collapse).',
      scenario:
        'Enterprise SaaS in Berlin, Germany. You are scaling fast, driving massive top-of-funnel traffic, but your unit economics are fracturing. You are burning cash to acquire users who churn in month four.',
      agencyGuess:
        'Spend heavily on top-of-funnel brand awareness campaigns to drive down the initial Cost Per Click (CPC). The assumption is that sheer volume will fix the revenue leak.',
      agencyComicPrompt:
        "[AI VISUAL COMMAND: AGENCY COMIC - Hipster CFO in a turtleneck happily shoveling stacks of Euro bills into a blazing furnace labeled 'CAC'.]",
      physicistRealignment:
        'We audit the cohorts. We find that mid-market logistics companies retain for 5 years, while startup tech companies churn in 90 days. We aggressively cut marketing to the startups, even though they were cheaper to acquire at the top of the funnel, and accept a higher initial CAC for the logistics segment.',
      physicistComicPrompt:
        '[AI VISUAL COMMAND: PHYSICIST COMIC - Marketer uses a surgical scalpel to cut away the cheap, toxic edge of a glowing fractal map, revealing a solid core.]',
      translation:
        "Your unit economics (LTV/CAC) are a coordinate on a fractal. The mid-market segment sits safely 'inside' the Mandelbrot set—bounded, profitable, and sustainable. The startup segment is one pixel outside the boundary, mathematically doomed to diverge to infinity and burn your cash reserves.",
    },
  },
  {
    id: 'wave-collapse',
    index: '05',
    scale: 'QUANTUM',
    accent: 'violet',
    title: "Every visitor is Schrödinger's customer until you measure them.",
    formula: '|ψ⟩ = α|Convert⟩ + β|Bounce⟩',
    copy: 'A probability cloud of one undecided buyer. Drag the observation line; the wave collapses with a flash. Each measurement is a real conversion event.',
    visualComponent: 'WaveCollapse',
    deepDive: {
      physics:
        'In quantum mechanics, a system exists in a superposition of all possible states until an observation or measurement forces it to collapse into a single, definite state.',
      scenario:
        "B2B Supply Chain Logistics in Singapore. You have 4,000 'warm' leads sitting in a CRM (Salesforce/HubSpot) that haven't moved in six months. They are clogging your pipeline visibility.",
      agencyGuess:
        "Put all 4,000 leads into a generic, 12-step automated email drip campaign featuring blog posts and company updates to gently 'nurture' them over the next year.",
      agencyComicPrompt:
        "[AI VISUAL COMMAND: AGENCY COMIC - Marketer gently petting a server rack and feeding it a bottle of milk labeled 'Weekly Newsletter'.]",
      physicistRealignment:
        "You send a single, highly polarized, plain-text email from the CEO: 'Are you still looking to optimize your freight routes this quarter, or should I close your file?' We force a hard yes or a hard no.",
      physicistComicPrompt:
        "[AI VISUAL COMMAND: PHYSICIST COMIC - Marketer slamming a giant red 'OBSERVE' stamp onto a blurry cloud. The cloud instantly crystallizes into a stark 'YES' or 'NO'.]",
      translation:
        "Every lead in your CRM is existing in a probability cloud of both buying and not buying. You cannot nurture a superposition. You must force an observation to collapse the wave. Even if 80% collapse into 'Bounce,' you now have 20% materialized, actionable reality to deploy your sales team against.",
    },
  },
  {
    id: 'dark-social',
    index: '06',
    scale: 'LENSING',
    accent: 'plasma',
    title: "You can't track the mass, but you can see how it bends the light.",
    formula: 'θ = 4GM / rc²',
    copy: 'An empty black screen. Moving the mouse acts as a gravitational lens, warping the starlight. Click and hold to reveal the massive hidden web of dark social.',
    visualComponent: 'GravitationalLensing',
    deepDive: {
      physics:
        'Massive objects in space bend the fabric of spacetime, causing light from background stars to curve around them, revealing the presence of invisible mass.',
      scenario:
        "Enterprise AI Platform in San Francisco. Massive spikes in 'Direct' traffic and branded search, but Hubspot shows zero attribution. Sales are closing, but marketing can't prove origin.",
      agencyGuess:
        "If UTMs don't track it, it doesn't exist. Shut off community management, stop doing podcasts, and put all the budget back into trackable Google Search ads.",
      agencyComicPrompt:
        '[AI VISUAL COMMAND: AGENCY COMIC - Marketer with blinders on, staring at a blank Google Analytics dashboard while a massive, vibrant party happens right behind him.]',
      physicistRealignment:
        'We accept that Dark Social (Slack channels, WhatsApp groups, private DMs) is untrackable dark matter. Instead of trying to put a tracking pixel on a private Slack message, we measure the lensing effect. We correlate the dates of podcast appearances and community drops with unexplained spikes in baseline branded search volume.',
      physicistComicPrompt:
        '[AI VISUAL COMMAND: PHYSICIST COMIC - Marketer looking through a massive telescope, watching light bend around an invisible, heavy black hole.]',
      translation:
        'You cannot track the origin of word-of-mouth. But you can mathematically measure how that unseen mass bends the conversion data (the light) around it.',
    },
  },
  {
    id: 'entropy-decay',
    index: '07',
    scale: 'THERMODYNAMIC',
    accent: 'solar',
    title: 'Every dataset, every list, every brand decays toward noise.',
    formula: 'ΔS ≥ 0',
    copy: "Order on the left, chaos on the right. Lists rot. Brand recall degrades. The work isn't to stop entropy — it's to inject energy faster than it leaks.",
    visualComponent: 'EntropyDecay',
    deepDive: {
      physics:
        'The Second Law of Thermodynamics states that the total entropy (disorder) of an isolated system can never decrease over time. Everything trends toward chaos.',
      scenario:
        'Heritage Financial Services in London, UK. You have an email database of 250,000 contacts collected over 10 years. Open rates are currently sitting at a dismal 2%. Deliverability is tanking.',
      agencyGuess:
        "Buy a new list of 50,000 scraped emails to add to the pile, and blast a massive re-engagement newsletter with a 'We Miss You!' subject line to all 300,000 contacts.",
      agencyComicPrompt:
        "[AI VISUAL COMMAND: AGENCY COMIC - Old-school London banker holding a 3.5-inch floppy disk protectively to his chest. Bubble: 'I bought these in 2012! They might still buy!']",
      physicistRealignment:
        "We utilize CRM segments to isolate anyone who hasn't clicked an email in 12 months. We offer them one exclusive, gated, high-value data report. If they don't claim it within 48 hours, we hard-delete them from the system.",
      physicistComicPrompt:
        '[AI VISUAL COMMAND: PHYSICIST COMIC - Marketer holding a flamethrower, burning away dead, gray data nodes to reveal a small, brightly glowing core of active users.]',
      translation:
        "Every dataset decays. Lists rot. People change jobs. The work isn't to stop entropy; it is to inject energy (value) faster than it leaks. Deleting dead weight removes the noise floor and saves your domain reputation. Amputation saves the host.",
    },
  },
  {
    id: 'bass-diffusion',
    index: '08',
    scale: 'ADOPTION',
    accent: 'acid',
    title: 'Innovators light the fire. Imitators carry it.',
    formula: 'f(t) = (p + q·F)·(1 - F)',
    copy: 'The Bass diffusion curve, fitted to your category. Innovators start the S-curve; imitators make it bend. Most go-to-market plans budget for the wrong half.',
    visualComponent: 'BassDiffusion',
    deepDive: {
      physics:
        'The Bass Model predicts how new products get adopted. It relies on two coefficients: p (innovation) and q (imitation).',
      scenario:
        'EdTech Platform in Bangalore, India. Growth was explosive for the first two years among tech-savvy early adopters, but now acquisition has completely flatlined.',
      agencyGuess:
        "More of the same. Pay larger tech influencers to shout out the product's cutting-edge blockchain and AI features.",
      agencyComicPrompt:
        "[AI VISUAL COMMAND: AGENCY COMIC - Agency guy aggressively trying to sell an 'AI Curriculum' to an unimpressed, pragmatic mother holding a school textbook.]",
      physicistRealignment:
        "We completely rewrite the messaging architecture. We stop talking about the 'AI-driven curriculum' (which innovators love) and start showing basic case studies of normal students getting better math grades (which imitators require).",
      physicistComicPrompt:
        "[AI VISUAL COMMAND: PHYSICIST COMIC - Marketer flipping a giant, heavy switch on a dashboard from 'VISIONARY MODE' to 'PRACTICAL MODE.' The S-curve chart bends upward.]",
      translation:
        'Innovators (p) start the S-curve; imitators (q) make it bend to the mass market. You tapped out the p variable. You cannot sell to the mass market using early-adopter physics.',
    },
  },
  {
    id: 'metcalfe-mesh',
    index: '09',
    scale: 'NETWORK',
    accent: 'magenta',
    title: 'The 12th integration is worth more than the first eleven combined.',
    formula: 'V ∝ n(n - 1) / 2',
    copy: "Metcalfe's law in graph form. Every new node you add to your ecosystem multiplies its value. Partnerships, integrations, communities: invest accordingly.",
    visualComponent: 'MetcalfeMesh',
    deepDive: {
      physics:
        "Metcalfe's Law states that the value of a telecommunications network is proportional to the square of the number of connected users of the system (n²).",
      scenario:
        'B2B Vendor Marketplace in São Paulo, Brazil. You have a great platform with sellers, but enterprise buyers are hesitant to switch from their massive, legacy SAP software.',
      agencyGuess:
        'Run massive LinkedIn Lead Gen forms offering buyers a 30-day free trial of your beautiful new marketplace portal.',
      agencyComicPrompt:
        "[AI VISUAL COMMAND: AGENCY COMIC - A lone, exhausted marketer waving a tiny 'Free Trial' flag outside a massive, impenetrable corporate fortress labeled 'SAP'.]",
      physicistRealignment:
        'We stop advertising to the end-user entirely. We pivot the marketing and dev budget to building seamless, native integrations with Salesforce, SAP, and local Brazilian ERPs. We make your platform the invisible middleman.',
      physicistComicPrompt:
        "[AI VISUAL COMMAND: PHYSICIST COMIC - The marketer isn't at the front door; they are underground, quietly plugging cables into the foundation of the fortress.]",
      translation:
        "Every new node (integration) you add doesn't increase your product's value linearly; it multiplies it. The 12th integration makes your ecosystem so sticky that ripping you out costs the company more than keeping you. Own the plumbing.",
    },
  },
  {
    id: 'nash-matrix',
    index: '10',
    scale: 'STRATEGIC',
    accent: 'violet',
    title: 'Discounting is rational, until everyone does it.',
    formula: '∀i: u_i(s*) ≥ u_i(s_i, s*₋ᵢ)',
    copy: "The 2x2 every category eventually finds. The Nash cell is rarely the best cell — but it's the one no one can leave. Pricing strategy is finding when to defect.",
    visualComponent: 'NashMatrix',
    deepDive: {
      physics:
        "In game theory, a Nash Equilibrium is a state where no player can gain an advantage by changing their strategy unilaterally. Often leads to a 'Prisoner's Dilemma'.",
      scenario:
        'Cloud Storage Provider in Austin, Texas. Competitors keep slashing prices by 5% every quarter to win market share. You are bleeding margins just to stay relevant in RFPs.',
      agencyGuess:
        "Match the competitor's price drop. Run a 'Price Match Guarantee' campaign to ensure you don't lose the bottom of the market.",
      agencyComicPrompt:
        '[AI VISUAL COMMAND: AGENCY COMIC - Two rival CEOs dressed as cowboys in a standoff. Both are pointing their guns directly at their own feet.]',
      physicistRealignment:
        'We refuse to drop the price. We exit the 2x2 matrix. Instead, we bundle a proprietary, non-comparable cybersecurity audit into the base tier. We change the unit of measurement so the client can no longer compare us apples-to-apples.',
      physicistComicPrompt:
        '[AI VISUAL COMMAND: PHYSICIST COMIC - Marketer flips the checkerboard over while the competitor is still planning a move, replacing it with a complex 3D chess set.]',
      translation:
        "Discounting is mathematically rational until everyone does it. The entire market is stuck in a sub-optimal Nash cell where nobody wins. Strategic pricing isn't about being cheaper; it's about finding the exact moment to defect and change the rules of the game.",
    },
  },
  {
    id: 'power-law',
    index: '11',
    scale: 'DISTRIBUTIONAL',
    accent: 'plasma',
    title: 'Five accounts. Eighty percent of revenue. Always.',
    formula: 'P(x) ∝ x⁻ᵅ',
    copy: "Power laws aren't an outlier — they're the rule. Customers, keywords, content: a tiny head, a vast tail. The strategy is which one you optimize for.",
    visualComponent: 'PowerLaw',
    deepDive: {
      physics:
        'A functional relationship where a relative change in one quantity results in a proportional relative change in the other. The 80/20 Pareto principle on steroids.',
      scenario:
        'Heavy Industrial Equipment Manufacturing in Perth, Australia. You have 800 active accounts being managed by a stretched sales and marketing team.',
      agencyGuess:
        "Build a universal automated drip campaign. Treat all 800 accounts with a standardized quarterly outreach cadence to ensure 'fair coverage'.",
      agencyComicPrompt:
        '[AI VISUAL COMMAND: AGENCY COMIC - Sales rep cheerfully handing out identical tiny cupcakes to a massive, 50-foot mining dump truck, and then to a guy with a shovel.]',
      physicistRealignment:
        'We run a deep revenue analysis. We discover five mining conglomerates drive 82% of total revenue. We fully automate the bottom 795 accounts with self-serve portals, and redirect 90% of the marketing budget into highly bespoke, white-glove ABM campaigns specifically for the top 5.',
      physicistComicPrompt:
        '[AI VISUAL COMMAND: PHYSICIST COMIC - Marketer ignoring a crowd of 795 ants to place a massive, gold-plated banquet table in front of 5 giant lions.]',
      translation:
        'Power laws are the dominant force in business. A tiny head and a vast tail. Equality in marketing spend is bad business. You optimize strictly for the heavy mass. Feed the lions, automate the rest.',
    },
  },
  {
    id: 'shannon-channel',
    index: '12',
    scale: 'INFORMATIONAL',
    accent: 'solar',
    title: 'Your message has a channel capacity. Stop overflowing it.',
    formula: 'C = B · log₂(1 + S/N)',
    copy: "Shannon told you the upper bound. Above the noise floor, more words don't add information — they subtract it. Positioning is signal-to-noise engineering.",
    visualComponent: 'ShannonChannel',
    deepDive: {
      physics:
        'The Shannon-Hartley theorem states the maximum rate at which information can be transmitted over a communications channel in the presence of noise.',
      scenario:
        'Enterprise Cybersecurity in Toronto, Canada. Your main landing page is an endless scroll of features, tech specs, compliance badges, and video testimonials. Conversion is practically zero.',
      agencyGuess:
        "The page isn't convincing enough. Add an interactive ROI calculator, an exit-intent pop-up, and an aggressive chatbot to capture their attention.",
      agencyComicPrompt:
        '[AI VISUAL COMMAND: AGENCY COMIC - User is literally buried alive under a mountain of digital paper, pop-ups, and badges, while an overly cheerful robot chatbot hovers above.]',
      physicistRealignment:
        'We slash 80% of the text. We leave a single, massive headline, one primary benefit, and a clear input field. We remove all navigation links.',
      physicistComicPrompt:
        '[AI VISUAL COMMAND: PHYSICIST COMIC - Marketer sweeps a massive pile of clutter off a desk into a trash can, leaving behind one single, glowing red button.]',
      translation:
        "Your message has a hard channel capacity dictated by the user's cognitive load. Above the noise floor, adding more words doesn't add information—it subtracts it. Positioning is pure signal-to-noise engineering. Clarity is violence. Strip the noise.",
    },
  },
  {
    id: 'turing-patterns',
    index: '13',
    scale: 'EMERGENT',
    accent: 'acid',
    title: "Segments aren't drawn. They precipitate.",
    formula: '∂a/∂t = D∇²a + f(a,b)',
    copy: "Reaction-diffusion: simple local rules, organic global patterns. Your ICP wasn't designed top-down — it emerged from interactions. Read the spots.",
    visualComponent: 'TuringPatterns',
    deepDive: {
      physics:
        "Alan Turing's mathematical model explaining how random noise in a uniform state can spontaneously evolve into stable, complex, and ordered spatial patterns via reaction and diffusion.",
      scenario:
        "Agricultural Tech (AgTech) in Cape Town, South Africa. You have a broad software tool that helps farmers, but you don't actually know who your Ideal Customer Profile (ICP) is.",
      agencyGuess:
        "Get in an air-conditioned boardroom, draw up three fictional 'Buyer Personas' (e.g., 'Farmer Fred'), and build ad campaigns around what you guess they want.",
      agencyComicPrompt:
        '[AI VISUAL COMMAND: AGENCY COMIC - Three marketers in suits sitting in a boardroom, taping a fake mustache onto a stock photo of a farmer.]',
      physicistRealignment:
        'We dump all your unstructured historical CRM, support tickets, and usage data into a raw segment analysis. We look for organic clusters. We realize that second-generation vineyard owners with 50-100 hectares are using the tool 4x more than anyone else.',
      physicistComicPrompt:
        '[AI VISUAL COMMAND: PHYSICIST COMIC - Marketer staring at a screen filled with static noise. Suddenly, the static aligns itself into a perfect, glowing fingerprint.]',
      translation:
        "Real customer segments aren't designed top-down in a boardroom; they precipitate from local interactions with your product. Let the organic, global patterns emerge from the noise. Don't invent the customer. Let the data confess.",
    },
  },
  {
    id: 'brownian-walk',
    index: '14',
    scale: 'STOCHASTIC',
    accent: 'magenta',
    title: 'The customer journey is a random walk with a destination.',
    formula: '⟨x²⟩ = 2Dt',
    copy: 'No buyer marches down a funnel. They drift, double back, sit still for months, then jump. The art is shaping the diffusion field — not forcing the path.',
    visualComponent: 'BrownianWalk',
    deepDive: {
      physics:
        'The random, uncontrolled movement of particles in a fluid as they constantly collide with other molecules. The mathematical model used to describe random walks.',
      scenario: 'High-End Medical Devices in Tokyo, Japan. The buying cycle takes 8 to 12 months.',
      agencyGuess:
        'Force buyers into a rigid 4-step funnel: Click Ad -> Download Whitepaper -> Book Demo -> Close. If they skip a step, retarget them aggressively until they comply.',
      agencyComicPrompt:
        '[AI VISUAL COMMAND: AGENCY COMIC - Agency guy aggressively trying to hammer a giant square block into a tiny round funnel hole.]',
      physicistRealignment:
        'We stop forcing the path. We blanket their digital environment with independent, valuable assets—podcasts, technical specs, peer reviews. We let them consume it in any order they choose, tracking the aggregate engagement.',
      physicistComicPrompt:
        '[AI VISUAL COMMAND: PHYSICIST COMIC - Marketer watching a ping-pong ball bounce randomly through a pinball machine. Instead of trying to grab the ball, they are placing bumpers to gently guide it toward the winning slot.]',
      translation:
        "The customer journey is a random walk. Buyers drift, double back, sit still for months, and then jump. You can't steer a hurricane. Your job is to shape the diffusion field and build the right walls, not force the vector.",
    },
  },
  {
    id: 'harmonic-resonance',
    index: '15',
    scale: 'RESONANCE',
    accent: 'violet',
    title: 'Hit the natural frequency, and the market shatters.',
    formula: 'x(t) = A cos(ωt - ϕ)',
    copy: 'A crystalline 3D structure. Drag the slider to find the exact frequency. When you hit resonance, the market status quo breaks wide open.',
    visualComponent: 'HarmonicResonance',
    deepDive: {
      physics:
        'When a system is driven by an external oscillating force at its natural frequency, it stores kinetic energy, leading to wildly amplified vibrations that can shatter the structure.',
      scenario:
        'SaaS Platform in London. You have a good product, but growth has completely plateaued. You are blending in with five other competitors.',
      agencyGuess:
        "We just aren't reaching enough people. Double the ad spend, buy more billboard space, and send twice as many emails.",
      agencyComicPrompt:
        '[AI VISUAL COMMAND: AGENCY COMIC - Marketer screaming into a megaphone at a solid brick wall, achieving nothing.]',
      physicistRealignment:
        "We analyze customer exit interviews and support tickets. We realize the market doesn't care about 'efficiency'; they are terrified of 'compliance fines'. We change the entire messaging architecture to vibrate precisely at that frequency.",
      physicistComicPrompt:
        '[AI VISUAL COMMAND: PHYSICIST COMIC - Marketer gently tapping a small tuning fork against a massive glass wall. The entire wall instantly shatters.]',
      translation:
        "Growth isn't a straight line, and it isn't about volume. It is about hitting the exact natural frequency of your market's pain point until their current status quo shatters. Dial in the message to achieve resonance.",
    },
  },
  {
    id: 'bayesian-update',
    index: '16',
    scale: 'INFERENTIAL',
    accent: 'plasma',
    title: 'Every signal updates the prior. Stop guessing.',
    formula: 'P(H|E) = P(E|H)·P(H) / P(E)',
    copy: 'Lead scoring is just Bayesian updating with a UI. Demo booked, exec replied, pricing visited — each one shifts the posterior curve.',
    visualComponent: 'BayesianUpdate',
    deepDive: {
      physics:
        'A theorem in statistics that describes how to update the probability for a hypothesis as more evidence or information becomes available.',
      scenario:
        "Luxury Commercial Real Estate in Dubai, UAE. Sales reps are wasting time calling leads who aren't ready, while hot leads are going cold and buying elsewhere.",
      agencyGuess:
        "Buy an expensive 'AI Predictive Lead Scoring' tool off the shelf that assigns arbitrary points (+5 for opening an email, +10 for clicking a link) and tells reps to call whoever has the most points.",
      agencyComicPrompt:
        '[AI VISUAL COMMAND: AGENCY COMIC - Sales bro blindfolded, throwing darts at a board covered in phone numbers.]',
      physicistRealignment:
        'We build a strict logic flow in the CRM. We establish a baseline conversion rate (the Prior). When a lead takes a high-intent action, like visiting the pricing page twice in 24 hours (Evidence), we mathematically update the probability of closing (the Posterior) and trigger a high-priority task for a rep.',
      physicistComicPrompt:
        '[AI VISUAL COMMAND: PHYSICIST COMIC - Calm observer watching a set of scales. Every time the user acts, a heavy gold weight is dropped onto the scale until it perfectly tips.]',
      translation:
        'Stop guessing. Every signal updates the prior. A demo booked or a pricing page visited shifts the posterior probability. Build the mathematical model, then trust it blindly.',
    },
  },
  {
    id: 'entanglement',
    index: '17',
    scale: 'QUANTUM',
    accent: 'solar',
    title: 'One champion moves. The whole account moves with them. Instantly.',
    formula: '|ψ⟩ = (|↑↓⟩ − |↓↑⟩)/√2',
    copy: 'Entangled buyers in the same org act non-locally. Win the right node and the rest collapse with you. Lose them, and so do they.',
    visualComponent: 'Entanglement',
    deepDive: {
      physics:
        'A quantum phenomenon where particles interact in such a way that the quantum state of each particle cannot be described independently of the state of the others, even when separated by a large distance.',
      scenario:
        'Enterprise HR Software in Paris, France. You spent 4 months successfully selling the HR Director. Just before signing, she gets replaced, and the deal instantly dies.',
      agencyGuess:
        'Start over from scratch. Put the new HR Director into an email sequence and start cold-calling them.',
      agencyComicPrompt:
        '[AI VISUAL COMMAND: AGENCY COMIC - Salesperson on one knee proposing to a single HR director through a window, completely ignoring the CEO, CFO, and IT Lead glaring at them.]',
      physicistRealignment:
        'We do not sell to single nodes. From day one, we map the entire buying committee. We provide the HR Director with specific PDF assets uniquely designed for her to forward to the CFO and the IT Lead. We entangle them inside the CRM.',
      physicistComicPrompt:
        '[AI VISUAL COMMAND: PHYSICIST COMIC - Marketer holding one end of a glowing quantum thread. It weaves through five different executives in an office. When the marketer pulls, all five heads turn.]',
      translation:
        'Buyers in the same organization act non-locally. Win the committee, not the contact. When one moves, they all move.',
    },
  },
  {
    id: 'observer-effect',
    index: '18',
    scale: 'UNCERTAINTY',
    accent: 'acid',
    title: 'The act of measuring alters the trajectory.',
    formula: 'ΔxΔp ≥ ℏ/2',
    copy: "Heisenberg's uncertainty. A blurry particle field that sharpens only when you stop tracking it.",
    visualComponent: 'ObserverEffect',
    deepDive: {
      physics:
        'In quantum mechanics, the observer effect is the disturbance of an observed system by the act of observation.',
      scenario:
        'Agri-Finance App in Nairobi, Kenya. You want to know why users are dropping off at the critical loan application screen.',
      agencyGuess:
        'Deploy a mandatory 10-question pop-up survey asking them why they are leaving right as their mouse moves to the exit button.',
      agencyComicPrompt:
        "[AI VISUAL COMMAND: AGENCY COMIC - Giant, obnoxious digital pop-up screen literally swatting a user's hand away from a 'Submit' button.]",
      physicistRealignment:
        "We kill the survey entirely. We use passive session recording and realize the keypad UI is obscuring the 'Submit' button on older Android devices.",
      physicistComicPrompt:
        '[AI VISUAL COMMAND: PHYSICIST COMIC - Ninja standing perfectly still in the shadows, silently watching a user navigate a maze through a heat-vision camera.]',
      translation:
        'The act of measuring a particle alters its trajectory. In marketing, aggressively surveying or interrupting a user to gather data inherently ruins the user experience you are trying to measure. You must collect data passively to observe the true state.',
    },
  },
  {
    id: 'activation-energy',
    index: '19',
    scale: 'KINETICS',
    accent: 'magenta',
    title: "Don't push them over the wall. Lower the wall.",
    formula: 'k = A e^(-E_a / RT)',
    copy: 'Arrhenius kinetics. Particles failing to cross an energy barrier, until a catalyst line drops the required energy to zero.',
    visualComponent: 'ActivationEnergy',
    deepDive: {
      physics:
        'Activation energy is the minimum amount of energy that must be provided to compounds to result in a chemical reaction. A catalyst lowers this activation energy.',
      scenario:
        "B2B Inventory Management SaaS in Mexico City. You have high traffic to your signup page, but a massive drop-off at the mandatory 'Connect Your Bank API' step.",
      agencyGuess:
        "Run aggressive, high-frequency retargeting ads reminding them of the benefits of connecting their bank to 'motivate' them.",
      agencyComicPrompt:
        "[AI VISUAL COMMAND: AGENCY COMIC - Agency guy with a megaphone yelling at a user who is staring at a massive, terrifying pile of 'Bank API Integration' paperwork.]",
      physicistRealignment:
        'We defer the bank connection step entirely. We let them build their inventory dashboard manually first, get a taste of the value, and only ask for bank details when they try to run their first automated financial report. We introduce a catalyst.',
      physicistComicPrompt:
        '[AI VISUAL COMMAND: PHYSICIST COMIC - Marketer placing a small chemical catalyst into a beaker. A massive reaction happens instantly with zero effort from the user.]',
      translation:
        'Reactions require a minimum threshold of energy (E_a) to occur. You can either pump massive amounts of heat (marketing budget) into the system to force the reaction, or you can use a catalyst (product-led growth) to lower the required activation energy.',
    },
  },
  {
    id: 'fluid-dynamics',
    index: '20',
    scale: 'MECHANICS',
    accent: 'violet',
    title: "Prettifying friction doesn't remove the friction.",
    formula: 'P + ½ρv² + ρgh = constant',
    copy: "Bernoulli's Principle. A pipe flow visualization. Narrow the pipe, remove the structural friction, and watch the particle velocity exponentially increase.",
    visualComponent: 'FluidDynamics',
    deepDive: {
      physics:
        "Bernoulli's principle states that an increase in the speed of a fluid occurs simultaneously with a decrease in static pressure.",
      scenario:
        'Consumer Neo-Bank in Jakarta, Indonesia. User onboarding takes 14 minutes due to mandatory KYC document uploads. Bounce rate is 80%.',
      agencyGuess:
        "Hire a UI/UX agency to redesign the 14-minute process to make it look 'prettier' and add a smooth, animated progress bar.",
      agencyComicPrompt:
        '[AI VISUAL COMMAND: AGENCY COMIC - User is drowning in a massive, leaky pipe full of paperwork. An agency guy is casually painting the outside of the pipe a nice shade of teal.]',
      physicistRealignment:
        'We integrate a local government ID API. The user snaps one photo of their face, the API pings the national database, and 12 form fields auto-populate. Onboarding drops to 90 seconds.',
      physicistComicPrompt:
        '[AI VISUAL COMMAND: PHYSICIST COMIC - Marketer wielding a massive wrench, snapping off a rusted 14-valve pipe and replacing it with a straight, greased chute. User slides down at lightning speed.]',
      translation:
        "As the velocity of a fluid increases, the internal pressure decreases. In a conversion funnel, if you remove structural friction and narrow the pipe, the velocity of the user completing the task exponentially increases, dropping the 'pressure' (bounce rate) to near zero.",
    },
  },
];
