# LinkedIn structure by post type

Rules for every draft:
- **Opener:** a statement containing a number or an artifact, never a question.
- **Numbers:** each one carries n, seeds or an interval.
- **Close:** the last line names the website page in words. No URL in the body; the link goes in an edit after 60–90 minutes, with no preview card.
- **Banned:** "game-changer", "unlock", "dive deep", "in today's fast-paced world", "here's the thing", emoji bullets.

Format names (carousel, single image) describe what Arun exports. The draft is the caption plus the slide text.

| Type | Format | Hook pattern | Structure |
|---|---|---|---|
| experiment | Carousel or single table image, caption 150–250 words | "[Method A] beat [B] on [benchmark] by [Δ, CI], except [condition]." | The claim → setup in 4 lines (data, n, model, metric) → results table with CIs → the surprising cell → threats to validity → verdict and what's next |
| ablation | Text + chart, or 6-slide carousel | "I expected [X]. The ablation says [not X]. Here's what that rules out." | What I expected and why → the ablation and its numbers → what would have changed my mind → what this does NOT show |
| benchmark | High-res table image | "[Thing] is N× faster at [setting] and slower at [other setting]." | Hardware, batch size, sequence length and versions visible on the image → caption explains the one row to remember |
| explainer | Carousel, one diagram per slide | "[Concept], explained with shapes only." | One clear diagram per slide; the last slide points to the build log or experiment behind it |
| buildlog | PDF carousel, 8–10 slides, caption 120–200 words | "I built [X] without [shortcut]. [The one surprising thing]." | Claim → what "from scratch" means → architecture → key code (15 lines max) → the test that matters → the bug → result → what I'd change → where the code lives |
| derivation | Single image or 5 slides, caption 100–150 words | "[Result] in one line. Here's why, and the check that proves it." | One clean derivation → why it matters in practice |
| bugautopsy | Text + one screenshot, 200–300 words | "[Symptom] at [step/time]. The cause was one line." | Symptom → hypotheses, ranked → the check that told them apart → root cause → the regression test added |
| papernote | 6–8-slide carousel | "The one claim in [paper] I'd test first, and how." | The problem → method in one diagram → key result as the paper states it → the assumption I don't buy → how I'd test it |
| reproduction | Carousel with a "Paper vs me" table | "The paper reports [X]. I got [Y] (n, seeds, CI). Here's where the gap comes from." | Exactly which claim → paper's numbers and mine in separate columns → where the gap comes from |
| trendtest | Text + one table image, within 72 h, 150–250 words | "[New release] claims [X]. I ran it on my benchmark: [result]." | The claim → exact setting → my number with n → what it does and doesn't say → the experiment it extends |
| fieldlog | Website only; on LinkedIn only as a monthly roundup carousel | "[Month] in numbers." | Hours, shipped, numbers, one surprise |
| reflection | Text post, 200–300 words | "[Specific event] exposed [specific gap]." | Specific and unglamorous; no generic lessons-learned lists |
| essay | Text post, 150–250 words | The position as a statement | The argument in three beats → the page name |
