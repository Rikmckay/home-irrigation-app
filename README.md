# Irrigation Manager

Personal home irrigation system management — map-based, single-user, no login required.

**Stack**: React + Vite + Supabase + Netlify  
**Maps**: Leaflet.js + OpenStreetMap (no API key)

---

## Setup Steps

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **anon/public API key** from  
   Project Settings → API.

### 2. Run the schema

1. In the Supabase dashboard, open the **SQL Editor**.
2. Paste the contents of `schema.sql` and click **Run**.
3. You'll see 5 tables created: `controllers`, `valve_boxes`, `connection_boxes`, `valves`, `watering_heads`.

> **Note:** RLS is disabled by default in the schema — this is intentional for a private single-user project. Your anon key gives full CRUD access. Keep your Supabase project private and don't commit your `.env` file.

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Install dependencies and run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 5. Deploy to Netlify

**Option A — Netlify CLI:**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

**Option B — Netlify Dashboard:**
1. Push the repo to GitHub.
2. In Netlify, click **Add new site → Import an existing project**.
3. Select your repo.
4. Build command: `npm run build` | Publish directory: `dist`
5. In **Site settings → Environment variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Trigger a deploy.

---

## App Pages

| Page | URL | Purpose |
|------|-----|---------|
| Map View | `/` | Full-screen map with all components, filter by controller/valve |
| Controllers | `/controllers` | Add/edit/delete irrigation controllers |
| Valve Boxes | `/valve-boxes` | Add/edit/delete valve boxes |
| Connection Boxes | `/connection-boxes` | Add/edit/delete connection/junction boxes |
| Valves | `/valves` | Add/edit/delete valves, grouped by controller |
| Watering Heads | `/watering-heads` | Add/edit/delete heads, grouped by valve |

## Map Marker Legend

| Color | Component |
|-------|-----------|
| Blue (large) | Controller |
| Orange (medium) | Valve Box |
| Yellow (medium) | Connection Box |
| Green (small) + letter | Watering Head — R=Rotor, P=Popup, M=Mister, D=Drip, O=Other |

## Setting Locations

Every add/edit form includes a **LocationPicker** — a small embedded map. Click anywhere on the map to drop a pin and capture the latitude/longitude. The default center is Victoria, BC — pan to your yard before clicking.

---

## Data Relationships

```
Controller
  └── Valve (many, via controller_id)
        └── Watering Head (many, via valve_id)
              └── Connection Box (optional, via connection_box_id)

Valve Box → houses Valves (via valve_box_id on valves table)
```

Deleting a Controller cascades to its Valves, which cascade to their Watering Heads.
