import os

CWD = "/Users/bedantanath/Documents/Inflow Media"
index_path = os.path.join(CWD, "index.html")

replacements = [
    ("Content Systems & Podcast Distribution", "Content Agency"),
    ("We Turn Coaches<br>\n      &amp; Founders Into<br>\n      <span class=\"hi\">Content That Grows.</span>", "Content Systems for Coaches,<br>\n      Founders, and<br>\n      <span class=\"hi\">Growing Brands.</span>"),
    ("Short-form video, podcast clips, and distribution — fully done for you. You run your business. We handle everything else.", "We build done-for-you content systems and distribution pipelines that turn your expertise into a consistent stream of inbound leads without you lifting a finger."),
    ("Across Instagram, YouTube & TikTok", "Instagram, YouTube Shorts and TikTok"),
    ("For coaches and founders we work with", "Driven for coaches and founders"),
    ("Organic growth, no paid ads", "One client. Twelve months. Zero paid ads."),
    ('<div class="s-lbl">Portfolio</div>', '<div class="s-lbl">Our Work</div>'),
    ('Selected <span class="ol">Work</span>', 'From Content <span class="ol">to Clients</span>'),
    ('<div class="s-lbl">How It Works</div>', '<div class="s-lbl">Process</div>'),
    ('We Become Your <span class="ol">Content Team</span>', 'How It <span class="ol">Works</span>'),
    ('Content Audit', 'Strategy Call'),
    ('We study your brand, your ICP, your competitors, and your existing content. Within 48 hours you get a full content strategy — topics, hooks, formats, platform priority, and a 30-day launch plan.', 'We study your brand, your audience, and your competitors. You leave with a full content roadmap whether you work with us or not.'),
    ('Record Once, We Handle the Rest', 'We Build, You Record'),
    ('You record on your phone or camera — we send you a simple setup guide. Send us the raw footage. Our editors cut, caption, rewrite hooks, and format for every platform. Delivered in 5 business days.', 'We write the scripts, you record on your phone. Send us the footage. We handle editing, captions, and formatting for every platform.'),
    ('Distribute & Compound', 'Distribute and Grow'),
    ('We post everything on the right schedule across Instagram, YouTube Shorts, and TikTok. We track performance weekly. What works gets doubled. Your content gets more dialled in. You focus on your business.', 'We post everything on the right schedule, track performance weekly, and double down on what works. Your content compounds month after month.'),
    ('You See Everything', 'Results You Can See'),
    ('Monthly report with views, reach, follower growth, engagement, and booked calls tied to content. No vanity metrics. You always know exactly what your content is doing for your business.', 'Weekly reports showing views, reach, follower growth, and booked calls tied to content. You always know what is working.'),
    ('<div class="s-lbl">What We Do</div>', '<div class="s-lbl">Services</div>'),
    ('Podcast Distribution System', 'For Coaches and Founders'),
    ('We turn your podcast episodes into 30+ platform-native clips per month — distributed across Instagram, YouTube Shorts, and TikTok. One recording session. A full month of content.', 'Scripts, edits, captions, thumbnails, and posting. A complete content team built around your offer, attracting your ideal clients every single month.'),
    ('Podcasts · Interviews · Webinars', 'Explore Service'),
    ('Founder Content Engine', 'For Podcasters and Creators'),
    ('Done-for-you short-form video for coaches and founders building a personal brand. Scripts, edits, captions, posting — handled. You record once. We distribute everywhere.', 'We clip your long-form episodes into 30 plus short-form videos per month and distribute them across every platform. One recording session becomes a full month of content.'),
    ('Coaches · Founders · Operators', 'Explore Service'),
    ('Growth and Distribution', 'Not Sure Which Fits?'),
    ("We manage the full content calendar, posting schedule, and platform analytics. You see what's working. We double down on it. Month over month your reach compounds.", "Book a free strategy call and we will tell you exactly which system fits your brand, your audience, and your goals. No obligation."),
    ('Multi-Platform · Analytics · Growth', 'Book a Call'),
    ('<div class="s-lbl">Social Proof</div>', '<div class="s-lbl">Client Results</div>'),
    ('What Clients <span class="ol">Say</span>', 'What Our Clients <span class="ol">Are Saying</span>'),
    ('// We Only Take 5 New Clients a Month', 'Limited Spots Available'),
    ('Ready to Go From Invisible to Inevitable?', 'Ready to Turn Your Expertise Into Inbound Leads?'),
    ('We keep our client roster small so every brand gets our full attention. Spots are limited and we move fast.', 'One strategy call. We audit your brand and build your content roadmap live on the call. No pitch deck, no pressure.'),
    ('→ 30-minute call · We audit your content live on the call · No pitch deck', '30 minute call. We come prepared with your full content audit.'),
    ('Content distribution for coaches and founders who are done being invisible online.', 'Done-for-you content systems and distribution for coaches, founders, and growing brands.')
]

with open(index_path, "r", encoding="utf-8") as f:
    content = f.read()

missing = []    
for find_str, rep_str in replacements:
    if find_str in content:
        content = content.replace(find_str, rep_str)
    else:
        # Also try collapsing spaces for matching
        find_compact = " ".join(find_str.split())
        content_compact_dict = { " ".join(content[i:i+len(find_str)*2].split()): i for i in range(len(content)) }
        # Let's just do a simple replacement
        missing.append(find_str)

with open(index_path, "w", encoding="utf-8") as f:
    f.write(content)

if missing:
    print("MISSING START")
    for m in missing:
        print(repr(m))
    print("MISSING END")
else:
    print("ALL REPLACED")
