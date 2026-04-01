# U.S. Apparel — Getting Started Guide
## Taking the Demo to Production (Step-by-Step)

**For:** The U.S. Apparel team
**Date:** March 22, 2026
**Live Demo:** http://usap.netlify.app/

---

## What You Have Right Now

The demo app at the link above is a **fully functional prototype** with 10,444 lines of code. It shows exactly what the final system will look like and do. Right now it runs on **dummy data** — your real product names and SKUs (scraped from usapparelonline.com) but with made-up customers, orders, and inventory numbers.

To make it real, you need to:
1. Set up your own accounts (Supabase + Netlify)
2. Connect your real data (QuickBooks Desktop + Elastic Suite)
3. Replace the dummy data with your actual business data

Here's how to do each step.

---

## Part 1: What is Elastic Suite?

Uncle mentioned they use "Elastic" — this is **Elastic Suite** (elasticsuite.com), a B2B wholesale ecommerce platform used by major apparel brands like Patagonia, The North Face, New Balance, and Burton.

### What Elastic Suite Does

| Feature | What It Means for U.S. Apparel |
|---------|-------------------------------|
| **Digital Catalog** | Your wholesale customers log in and browse your products with images, colors, specs |
| **B2B Ordering** | Customers place wholesale orders directly through the portal |
| **Order Management** | Orders come through the platform (but currently get emailed to your admin) |
| **Product Merchandising** | Showcase products with 360-degree views, on-model photos, videos |
| **Sales Rep Dashboards** | Your reps can manage their accounts and orders |
| **ERP Integrations** | Can connect to QuickBooks, SAP, NetSuite via flat files, APIs, or ERP adapters |

### The Current Problem with Elastic

Right now, Elastic Suite generates an **email** when a customer places an order. Your admin team then:
1. Reads the email
2. Prints it out
3. Manually types it into QuickBooks Desktop

**This is the #1 bottleneck we're eliminating.** Elastic Suite has integration capabilities (APIs, flat file exports, ERP adapters) that can push orders directly into your system — no email, no printing, no retyping.

### What to Ask Your Elastic Suite Account Manager

Call your Elastic Suite representative and ask:

1. **"Do we have API access on our plan?"** — Some plans include API access, some don't
2. **"Can we get a flat file export of orders?"** — Even without API, they can usually set up automatic CSV/XML exports
3. **"What ERP adapters do you offer?"** — They may have a QuickBooks adapter already
4. **"Can we get webhook notifications for new orders?"** — This would let our system receive orders in real-time
5. **"Who is our technical contact for integrations?"** — You'll need someone at Elastic to help configure the data connection

**Elastic Suite Contact:** Check your account portal at elasticsuite.com or email their support team.

---

## Part 2: Set Up Your Own Supabase Account

Supabase is the **database** that will store all your business data (customers, orders, inventory, pricing). It's free to start.

### Step-by-Step:

**Step 1: Create Account**
1. Go to https://supabase.com
2. Click "Start your project" (top right)
3. Sign up with email or GitHub account
4. Verify your email

**Step 2: Create a Project**
1. Click "New Project"
2. **Name:** `US-Apparel-HQ`
3. **Database Password:** Choose a strong password and WRITE IT DOWN — you'll need it later
4. **Region:** Choose `East US (North Virginia)` — closest to Orlando
5. Click "Create new project"
6. Wait 1-2 minutes for it to set up

**Step 3: Get Your API Keys**
1. Go to **Settings** (gear icon, bottom of sidebar)
2. Click **API** in the left menu
3. Copy these two values and save them somewhere safe:
   - **Project URL** — looks like `https://xxxxx.supabase.co`
   - **anon/public key** — starts with `eyJhbGc...` (long string)
4. You'll give these to us to connect the app

**Cost:** Free for up to 500MB of data and 50,000 monthly requests. This covers U.S. Apparel easily. If you grow past that, Pro plan is $25/month.

---

## Part 3: Set Up Your Own Netlify Account

Netlify **hosts** the web application — it's where the app lives on the internet. Also free to start.

### Step-by-Step:

**Step 1: Create Account**
1. Go to https://app.netlify.com/signup
2. Sign up with email (or GitHub/Google)
3. Verify your email

**Step 2: Create a Site**
1. Click "Add new site" → "Deploy manually"
2. You can drag and drop the app folder to deploy (we'll handle this for you initially)

**Step 3: Custom Domain (Optional)**
1. Go to **Site settings** → **Domain management**
2. Click "Add custom domain"
3. You could use something like `portal.usapparelonline.com` or `app.usapparelonline.com`
4. Follow the DNS instructions to point your domain

**Cost:** Free for basic hosting. Pro plan ($19/month) adds team features and more bandwidth.

---

## Part 4: Connect QuickBooks Desktop

This is the most important integration. QuickBooks Desktop doesn't have a cloud API like QuickBooks Online, so we need a **bridge** to connect it.

### Option A: QuickBooks Web Connector (Free, Official)

The Web Connector is Intuit's free tool that syncs data between QuickBooks Desktop and web applications.

**Step 1: Download Web Connector**
1. Go to https://developer.intuit.com/app/developer/qbdesktop/docs/get-started/get-started-with-quickbooks-web-connector
2. Download the latest QuickBooks Web Connector installer
3. Right-click the zip file → Extract All
4. Right-click `QBWebConnectorInstaller.exe` → Run as Administrator
5. Follow the installation wizard, accept the license, click Install

**Step 2: Configure in QuickBooks**
1. Open QuickBooks Desktop as Administrator
2. Make sure you're in **single-user mode**
3. Go to **File → App Management → Update Web Services**
4. This launches the Web Connector

**Step 3: Grant Permissions**
1. When prompted, select **"Yes, always; allow access even if QuickBooks is not running"**
2. Allow access to personal data (needed for customer/order data)
3. Check the box next to the application
4. Click "Update Selected"

**Step 4: Connect to Our App**
We will provide you with a `.qwc` file (QuickBooks Web Connector configuration file) that tells the Web Connector where to send/receive data. You just:
1. Click "Add an Application" in the Web Connector
2. Browse to the `.qwc` file we provide
3. Enter the password we set up
4. Done — it will sync automatically every few minutes

**Important Notes:**
- The computer running QuickBooks Desktop must be ON for syncing to work
- Web Connector polls for updates (every 5-15 minutes, configurable)
- It's not real-time, but close enough for wholesale operations

### Option B: Webgility (Paid, Easier)

If you want a plug-and-play solution, Webgility is a proven QuickBooks Desktop integrator used by 10,000+ businesses.

1. Go to https://www.webgility.com
2. Sign up for a trial
3. Install their desktop app
4. Connect to QuickBooks Desktop (guided setup)
5. We configure it to sync with the Command Center

**Cost:** $79-$249/month depending on plan

### Option C: Migrate to QuickBooks Online (Best Long-Term)

QuickBooks Online has a full modern API — much easier to integrate. If you're open to migrating:

1. Go to https://quickbooks.intuit.com/desktop/enterprise/move-to-online/
2. Intuit has a migration tool that moves your data
3. Once on QBO, we connect via OAuth API — real-time sync, no Web Connector needed
4. **Cost:** $275/month for QBO Advanced (25 users)

**Our Recommendation:** Start with Option A (free Web Connector) now, plan migration to QuickBooks Online within 6-12 months.

---

## Part 5: Connect to Elastic Suite

### What We Need from Elastic

Contact your Elastic Suite account manager and get:

1. **API credentials** (if available on your plan):
   - API key or OAuth credentials
   - Base URL for your Elastic instance
   - Documentation for their order export endpoint

2. **Flat file export setup** (fallback if no API):
   - Ask them to set up automatic CSV export of new orders
   - Export to an SFTP folder or email
   - Include: order ID, customer, products, quantities, prices, shipping address

3. **Webhook URL** (ideal):
   - We'll give you a URL like `https://your-app.netlify.app/api/elastic-webhook`
   - Elastic sends a notification to this URL every time a new order comes in
   - Our app catches it and creates the order automatically

### Integration Flow (After Setup)

```
Customer places order on Elastic Suite
        ↓
Elastic sends order data (API/webhook/file)
        ↓
Our app receives it automatically
        ↓
Order appears in Command Center dashboard
        ↓
App pushes order to QuickBooks Desktop (via Web Connector)
        ↓
QuickBooks processes it (credit check → warehouse → ship)
        ↓
Tracking info flows back to customer portal
```

**No more printing emails. No more manual data entry.**

---

## Part 6: Replace Dummy Data with Real Data

Once Supabase and connections are set up, we need to load your real data:

### Products
- Export your full product list from QuickBooks Desktop (Items & Services list)
- Or: We already scraped 68 products from usapparelonline.com — we'll verify and add any missing ones

### Customers
- Export your customer list from QuickBooks Desktop (Customer & Jobs list)
- Include: company name, contact person, email, phone, address, payment terms
- We'll assign pricing tiers based on your current PDF tier system

### Pricing Tiers
- Give us your current PDF price sheets
- We'll digitize them into the system (Platinum/Gold/Silver or whatever your tiers are called)

### Historical Orders (Optional)
- Export past 12 months of orders from QuickBooks (Sales Orders report)
- This feeds the AI reorder prediction engine — more history = better predictions

### Inventory
- Export current stock levels from QuickBooks (Inventory Valuation report)
- Going forward, inventory syncs automatically

---

## Part 7: What You Get When It's All Connected

| Feature | Before (Current) | After (Connected) |
|---------|------------------|-------------------|
| **Order intake** | Email → print → manual entry | Automatic (Elastic → App → QuickBooks) |
| **Order processing time** | 25-35 min per order | 2-3 min (review + approve) |
| **Customer pricing** | Manual PDF creation | Dynamic — each customer sees their tier price |
| **Order tracking** | "Call the office" | Self-service portal with real-time status |
| **Inventory visibility** | Check QuickBooks manually | Real-time dashboard with alerts |
| **Reorder reminders** | None — wait for customer to call | AI predicts and sends reminders automatically |
| **Shipping labels** | Manual UPS/FedEx | Batch labels via ShipStation |
| **Reporting** | Run reports in QuickBooks | One-click dashboards with charts |

---

## Cost Summary (What You'll Pay)

| Item | Cost | Frequency |
|------|------|-----------|
| Supabase (database) | $0 (free tier) → $25/mo if needed | Monthly |
| Netlify (hosting) | $0 (free tier) → $19/mo if needed | Monthly |
| ShipStation (shipping) | $60/mo | Monthly |
| QuickBooks Web Connector | $0 (free) | Free |
| Custom domain (optional) | $12/year | Yearly |
| **Total** | **$60–$104/month** | |

Compare to Oracle ERP: **$57,000+ Year 1, then $27,000+/year**

---

## Checklist — What the U.S. Apparel Team Needs to Do

- [ ] **Create Supabase account** (Part 2) — 5 minutes
- [ ] **Create Netlify account** (Part 3) — 5 minutes
- [ ] **Share Supabase API keys with us** (Project URL + anon key)
- [ ] **Call Elastic Suite account manager** — ask about API access, flat file exports, webhooks
- [ ] **Install QuickBooks Web Connector** (Part 4, Step 1-2) — 10 minutes
- [ ] **Export product list from QuickBooks** — Items & Services → Export to Excel
- [ ] **Export customer list from QuickBooks** — Customer & Jobs → Export to Excel
- [ ] **Give us your current PDF price sheets** — so we can digitize the tiers
- [ ] **Export last 12 months of orders** (optional) — for AI predictions
- [ ] **Sign up for ShipStation** (https://www.shipstation.com) — when ready for shipping automation

---

## Questions? Contact Us

We built this demo in one evening to show what's possible. The full production system with all your real data can be running within **2-3 weekends** once we have the accounts and data above.

**Demo App:** https://usapparel-command-center-live.netlify.app
**Spec Document:** See `US-Apparel-System-Architecture-Spec.md` in this folder

---

*Built with Claude Code by Solomon AI (Yasin Arshad)*
