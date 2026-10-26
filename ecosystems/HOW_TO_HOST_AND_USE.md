# Ecosystems Study Guide: How to Host It and How to Use It

The study guide is one self-contained file, `Ecosystems_Study_Guide.html` (about 0.5–1.5 MB). It holds the diagrams and about 100 practice questions, makes no network calls, and works offline once open. A print version, `Ecosystems_Study_Guide_Print.pdf`, is also included.

**Quick recommendation:**
- **Start with Option 1.** Put the file on the Chromebook and open it in Chrome. It's free, private and takes five minutes.
- **If you want a link** the student can open anywhere, use **Option 2 (Netlify)** or **Option 3 (GitHub Pages)**.
- **Skip putting the NAS on the internet.**

*(Steps checked against official docs, October 2026. Menu names on these sites change often, so look for something close if a label doesn't match exactly.)*

## Quick comparison

| Option | Cost | Effort | Account? | Shareable URL? | School Chromebook? | Privacy |
|---|---|---|---|---|---|---|
| 1. Open the file directly | Free | 5 min | No | No (you copy the file) | Usually. Admins *can* block USB, downloads or `file://` pages | Best: nothing goes online |
| 2. Netlify Drop | Free plan | 10 min | Yes, in practice (see below) | Yes, `yourname.netlify.app` | Usually, unless the school filter blocks `netlify.app` | Public to anyone with the link |
| 3. GitHub Pages | Free | 15–20 min | Yes (GitHub) | Yes, `username.github.io/repo` | Usually, but `github.io` is sometimes filtered | Public. The file itself is also public |
| 4. Cloudflare Pages | Free | 15 min | Yes (Cloudflare) | Yes, `name.pages.dev` | Usually | Public to anyone with the link |
| 5. Synology Web Station (home network only) | Free (your NAS) | 20–30 min | Your DSM admin login | Only on your home Wi-Fi | At home, if the school filter allows local addresses | Very private |
| 6. Google Sites (embed) | Free | 15 min, plus a host from 2–4 | Google | Yes, `sites.google.com/...` | Usually | Public or restricted |

---

## Option 1: Open the file directly (no hosting)

**On a Mac**
1. Double-click `Ecosystems_Study_Guide.html`. It opens in your default browser.
2. To use Chrome instead, right-click the file and choose **Open With → Google Chrome**.

**On the Chromebook**
1. **Get the file onto the Chromebook** in one of these ways:
   - **USB stick:** plug it in and drag the file into **My files › Downloads** in the **Files** app.
   - **Google Drive:** upload the file to Drive. On the Chromebook, open **Files › Google Drive**, then copy the file into **My files › Downloads**.
   - **Synology share link:** see Option 5. The link downloads the file, which is exactly what you want here.
2. In **Files**, double-click the file. It opens in a Chrome tab. You can also press **Ctrl + O** in Chrome and pick the file.
3. **Don't open it from the Google Drive website.** Drive's preview shows HTML as raw code instead of running the page. Always download it first.
4. Keep a spare copy in Google Drive. ChromeOS sometimes deletes files in Downloads when storage runs low.

**If the school Chromebook blocks this:** Google's admin tools let schools block USB drives, downloads or `file://` pages. Some school accounts also refuse files shared from personal Google accounts. If so, use a hosted link (Options 2–4) rather than working around school settings.

---

## Option 2: Netlify Drop (fastest way to get a link)

Rules as of October 2026:
- **No account is needed to drop, but the site isn't usable until claimed.** Anonymous drops sit behind a temporary password. You have **about one hour** to claim one by signing up or logging in; unclaimed drops are removed.
- **New accounts start private.** Teams created on or after July 28, 2026 make new projects **private**, and on the Free plan only the owner can see them. You must click **Make public**, or the student gets an "ask for access" page.
- **Free plan limits:** 300 credits a month (hard cap). Each update costs 15 credits and 1 GB of traffic costs 20, so one small page is far under the limit.

Steps:
1. Make a folder called `ecosystems-guide`. Put a copy of `Ecosystems_Study_Guide.html` in it and rename the copy to **`index.html`**. Drop also accepts a single HTML file, but a folder with `index.html` is the most reliable way.
2. Create a free account at **app.netlify.com/signup**. Signing in first saves you the claim step.
3. Go to **app.netlify.com/drop** and drag the `ecosystems-guide` folder onto the drop zone.
4. In a few seconds you get a URL like `https://random-words-123.netlify.app`.
5. Click **Make public**. You can also go to **Project configuration → General → Visitor access → Project visibility**.
6. **Rename the address** (also offered on the **Make public** screen): go to **Project overview → Customize → Manage project name**. A name like `alex-ecosystems` gives `https://alex-ecosystems.netlify.app`.
7. Open the link on the Chromebook to test it.

---

## Option 3: GitHub Pages

1. Create a free account at **github.com**. Your username becomes part of the address.
2. Click **+ → New repository**. Name it `ecosystems`, choose **Public** (required on the free plan), turn **Add README** on, and click **Create repository**.
3. Click **Add file → Upload files**. Drag in your renamed **`index.html`** and click **Commit changes**.
4. Go to **Settings → Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**. Pick **main** and **/(root)**, then click **Save**.
5. Wait up to about 10 minutes, then click **Visit site**. The address is `https://<username>.github.io/ecosystems/`.

**Note:** both the page and the file in the repository are public. That's fine here because the guide contains no personal information.

---

## Option 4: Cloudflare Pages (drag-and-drop upload)

Cloudflare now says to start new projects on Workers, but Workers' dashboard setup uses templates or Git, not drag-and-drop. **Pages Direct Upload is still supported** (docs updated April 2026) and is the simple path here.

1. Create a free account at **dash.cloudflare.com/sign-up**.
2. Go to **Workers & Pages → Create application → Get started → Drag and drop your files**. Pick the Pages option if both are shown.
3. Type a project name, drag in your `ecosystems-guide` folder (a .zip also works), and click **Deploy site**.
4. Your site is at `https://<project-name>.pages.dev`.

---

## Option 5: Synology NAS with Web Station (home network only)

**Hosting on the home network (DSM 7.2+):**
1. In DSM, open **Package Center**, search for **Web Station** and install it. This creates a shared folder called **`web`** (`/volume1/web`). The web server already has read access to it.
2. Copy `Ecosystems_Study_Guide.html` into `web`. Use **File Station → Upload**, or on the Mac use **Finder → Go → Connect to Server** with `smb://<NAS-IP>/web`. Optionally rename it to `index.html`.
3. Open **Web Station → Web Service Portal** and confirm the **Default server** is enabled. It serves the `web` folder.
4. Find the NAS's IP address in **Control Panel → Network → Network Interface**. In your router, reserve that address for the NAS so it doesn't change.
5. On the Chromebook (on home Wi-Fi), go to `http://192.168.x.x/`, or `http://192.168.x.x/Ecosystems_Study_Guide.html` if you kept the original name. Chrome 154's new HTTPS warnings skip local addresses; a small "Not secure" label is normal.

**Reaching the NAS from outside the house:**
- **QuickConnect won't work.** Synology's QuickConnect list covers its own apps (File Station, Drive, Photos and so on), not Web Station websites.
- **The alternative is risky.** It means dynamic DNS, a Let's Encrypt certificate, and router port forwarding or a reverse proxy. That puts the NAS holding your family's files on the open internet, where it will be scanned and attacked constantly. Synology itself advises opening only the ports you need, plus 2-factor sign-in and Auto Block. **For one study page, use Options 2–4 instead.**

**Synology Drive and File Station share links don't display web pages.** Synology's DSM 7 docs say Drive public links preview only Synology Office files and images; other types download. File Station (`gofile.me`) links download too. So a share link can *deliver* the file to the Chromebook (then follow Option 1), but it can't *host* the page. School filters may block `gofile.me` or `quickconnect.to`.

---

## Option 6: Google Sites (embed)

- **Insert → Embed → Embed code** puts pasted HTML in a sandboxed frame. Google publishes no size limit, but users report "code too big" errors, and a ~1 MB page is very likely to fail or lag. **Don't paste the file.**
- **Instead,** host it with Option 2, 3 or 4, then choose **Insert → Embed → By URL**, paste the address, click **Insert**, then **Publish**. **Pages → Full page embed** also works.
- Add an **"Open full screen"** link. Download progress and Print may be limited inside an embedded frame (untested).

## A note on school networks

- School web filters sometimes block hosting domains such as `*.netlify.app`, `*.github.io` or `*.pages.dev`.
- Many filters run **on the Chromebook itself**, so they apply at home too.
- **Test the link on the actual school Chromebook** before the student relies on it. If it's blocked, fall back to Option 1.

---

## How the student uses it

**The tabs** follow the study path, numbered 1 to 4 in the top bar.
- **Home:** the big button always shows the **recommended next step**. Below it, five step cards (Learn → Practice → Mock test → Fix misses → Index card) show progress, and nine **topic cards** each list Ms. Hero's checklist items with **Learn** and **Practice** buttons.
- **① Learn:** one topic per page, so the student isn't facing one long scroll. Each topic opens with:
  - a green **"Know it cold"** summary;
  - a **checklist card**: Ms. Hero's checklist items as clickable chips that jump to each section, the class handouts to re-read, a fold-out list of **key terms with definitions**, and a **Practice this topic** button.
  
  The left sidebar (a drop-down menu on small screens) lists the nine topics, with a colored mastery dot for each. Every topic page ends with **Practice Topic N** and **Next topic** buttons.
- **② Practice:** a **Recommended next** card, plus topic tiles. Use **Only this ▶** for a single topic, or tick several. Questions come one at a time with a **Hint** button. A wrong first try explains *why that choice is wrong* and allows one more try. Then comes the full explanation, the trap being tested, and a **Review** link that opens the exact study section; the **↩ Back to my question** button returns. Dots across the top show right and wrong for the session.
- **③ Mock Test:** 25 questions, optional 30-minute timer, a numbered grid to jump between questions, **⚑ Flag**, and no feedback until you submit. **Quit (no score)** leaves without saving. Results show the score by topic and a full review of all 25 questions.
- **④ My Results:** a **next best step** banner, mastery by topic, a focus list naming the sections to re-read, missed questions with explanations, **Retry all missed**, **Download progress** / **Load progress**, and **Print my report**.
- **Quick Review:** a searchable **Glossary** of 83 key terms (filter by topic), **Common Traps** (30 confused pairs), and the **Index Card** model.

**Suggested 5-day plan** (also on the Home tab)
- **Days 1–3:** Learn a topic, then press **Practice Topic N** at the bottom of the page. Do one to three topics a day. **Download progress** at the end of each session.
- **Day 4:** Mock Test with the timer on, in one sitting.
- **Day 5:** My Results → **Retry all missed**. Reread the weak topics, skim **Quick Review → Common Traps**, then write the index card.

**Saving and restoring progress.** Progress lives only in the open tab. **Closing or refreshing the tab erases it.**
1. Before closing, go to **My Results → Download progress**. A small file ending in `.json` lands in **My files › Downloads**.
2. Next time, open the guide, go to **My Results → Load progress**, and pick that `.json` file.
3. Copy progress files into Google Drive now and then, since ChromeOS may clear Downloads.

**Printing**
- **Print my report** opens Chrome's print window. Choose a printer, or **Save as PDF**.
- For a paper copy of the whole guide, open `Ecosystems_Study_Guide_Print.pdf` and press **Ctrl + P**.

**Troubleshooting**
- **Page is blank, broken, or shows code:**
  - Make sure the whole file copied. It should be about 0.5–1.5 MB, not a few KB.
  - Open it in **Chrome**, not in Google Drive's preview.
- **"Can't open file" or a blocked page:** school policy is probably the cause. Use a hosted link (Options 2–4).
- **Progress file won't load:**
  - Choose the `.json` saved earlier from **Load progress**. Don't double-click the `.json` itself.
  - Chrome adds `(1)`, `(2)` to repeat downloads, so pick the newest one.
- **Timer:** switching tabs doesn't pause it. Set aside 30 quiet minutes, or turn the timer off.
- **Work disappeared:** the tab was closed or refreshed before Download progress. Download often.

**Privacy.** No logins, tracking or network calls. Answers and scores stay in the tab and in any `.json` files you save. Hosting only makes the guide itself viewable; no student data is uploaded. Hosts may keep normal server logs (such as visitor IP addresses), like any website.

---

## Updating the guide later

- **Local file (Option 1):** copy the new `Ecosystems_Study_Guide.html` over the old one.
- **Netlify:** in your project, drag the updated `ecosystems-guide` folder onto the **Production deploys** drop area (15 credits per update).
- **GitHub Pages:** **Add file → Upload files**, upload the new `index.html` (it replaces the old one), and **Commit changes**. It's live within about 10 minutes; press **Ctrl + Shift + R** to refresh.
- **Cloudflare Pages:** open the project, choose **Create a new deployment → Production**, and drag in the updated folder.
- **Synology:** overwrite the file in the `web` folder.
- **Google Sites:** nothing to do if it embeds a hosted URL.
- **Old progress files:** if the questions changed, older `.json` files may not match. Check with whoever built the update.

---

## Sources

- Netlify, Create deploys (drag and drop): https://docs.netlify.com/deploy/create-deploys/
- Netlify Drop Quickstart (sign-in, temporary password, updating): https://docs.netlify.com/start/quickstarts/netlify-drop-quickstart/
- Netlify, Anonymous deploys (one-hour claim window): https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/#anonymous-deploys
- Netlify blog, "The 13-year story of Netlify Drop" (claim window, password protection, retention), July 2026: https://www.netlify.com/blog/thirteen-years-of-netlify-drop/
- Netlify, Project visibility (private by default from July 28, 2026): https://docs.netlify.com/manage/security/secure-access-to-sites/project-visibility/
- Netlify, Customize project name: https://docs.netlify.com/manage/projects/customize-project-name-and-cover-image/
- Netlify, Credit-based pricing plans: https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/
- Netlify Drop page ("folder, zip file, or single HTML file"): https://app.netlify.com/drop
- GitHub Docs, Creating a GitHub Pages site: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- GitHub Docs, Configuring a publishing source: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- GitHub Docs, GitHub Pages limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- Cloudflare Pages, Direct Upload: https://developers.cloudflare.com/pages/get-started/direct-upload/
- Cloudflare Pages overview ("Start new projects with Workers"): https://developers.cloudflare.com/pages/
- Cloudflare Workers, Dashboard get-started and Static Assets: https://developers.cloudflare.com/workers/get-started/dashboard/ and https://developers.cloudflare.com/workers/static-assets/
- Chromebook Help, Open, save, or delete files: https://support.google.com/chromebook/answer/1700055
- Chromebook Help, File types & external devices: https://support.google.com/chromebook/answer/183093
- Chrome Enterprise, URL blocklist filter format (`file` scheme can be blocked): https://support.google.com/chrome/a/answer/9942583
- Chrome Enterprise, Set Chrome policies for users or browsers (external storage, downloads): https://support.google.com/chrome/a/answer/2657289
- Google Security Blog, "HTTPS by default" (Chrome 154; private sites exempt): https://blog.google/security/https-by-defau/
- Synology, Web Station Web Portal (DSM 7): https://kb.synology.com/en-global/DSM/help/WebStation/application_webserv_virtualhost?version=7
- Synology, Folder permissions for websites: https://kb.synology.com/en-global/DSM/tutorial/What_should_I_set_permissions_to_folders_for_websites
- Synology, Which services support QuickConnect: https://kb.synology.com/en-us/DSM/tutorial/Which_services_support_QuickConnect
- Synology, Share File Links (File Station): https://kb.synology.com/en-global/DSM/help/FileStation/sharing?version=7
- Synology, Synology Drive web portal and public link previews (DSM 7): https://kb.synology.com/en-us/DSM/help/SynologyDrive/drive_file_management?version=7
- Synology, Enhance the security of your NAS: https://kb.synology.com/en-sg/DSM/tutorial/How_to_add_extra_security_to_your_Synology_NAS
- Google Sites Help, Add content and embed code: https://support.google.com/sites/answer/90569
