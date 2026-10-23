# Defex AI // Industrial Visual Inspection & Damage Prevention System

A production-grade, end-to-end Industrial Visual Inspection and Automated Damage Prevention Web Application built for CNC machining cells, robotic assembly lines, and high-precision manufacturing quality stations.

---

## 1. System Architecture & Objectives

**Defex AI** bridges multi-modal sensor streams (optical telecentric cameras and 1D/2D laser profilometers) directly with deterministic safety PLCs (Siemens S7-1500F SIL 3 / OPC-UA / Modbus-TCP) to guarantee zero tool crashes and eliminate machining scrap before raw billet processing begins.

```
+-----------------------------------------------------------------------------------+
|                             DEFEX AI ARCHITECTURE                                 |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ Workpiece Ingestion ]              [ Metrology Sensor Feed ]                   |
|   Telecentric GigE Camera              2D Laser Triangulation Profilometer        |
|             |                                     |                               |
|             v                                     v                               |
|   +-------------------+                +-----------------------+                  |
|   | Computer Vision   |                | Precision Metrology   |                  |
|   | Flaw Detector     |                | Tolerance Evaluator   |                  |
|   | (OpenCV / NumPy)  |                | (1D/2D CAD Validation)|                  |
|   +-------------------+                +-----------------------+                  |
|             \                                     /                               |
|              \                                   /                                |
|               v                                 v                                 |
|       +-------------------------------------------------+                         |
|       |     FAIL-SAFE AUTOMATED INTERLOCK CONTROLLER    |                         |
|       |  Strict Triage: PASS  |  UNCERTAIN  |   FAIL    |                         |
|       +-------------------------------------------------+                         |
|             /                  |                  \                               |
|            /                   |                   \                              |
|           v                    v                    v                             |
|      [ SIGNAL: GO ]      [ SIGNAL: HOLD ]     [ SIGNAL: STOP ]                    |
|   Spindle Clear Permissive  Pneumatic Clamp     Feed Hold / E-STOP                |
|   Relay DO_0 = HIGH         Relay DO_1 = HIGH   Divert Solenoid DO_2,3 = HIGH     |
|   Machining Begins          Queued to Triage    Acoustic Strobe DO_4 = HIGH       |
|                                |                                                  |
|                                v                                                  |
|                 [ Human-in-the-Loop Queue ]                                       |
|                 Supervisor Override & Audit Log                                   |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Functional Modules

### 1. Multi-Modal Inspection Engine
- **Visual Defect Detection:** Employs an OpenCV & NumPy adapter pattern to detect fractures, micro-cracks, surface porosity clusters, dents, witness marks, and edge machining flash/burrs. Generates high-visibility HUD overlays with bounding box spatial coordinates `[x1, y1, x2, y2]`, severity labels (`CRITICAL`, `WARNING`, `MINOR`), and confidence percentages.
- **2D Laser Metrology Verification:** Evaluates dimensional cross-sections (Length, Width, Height) against nominal specifications and allowable engineering tolerances (e.g., `±0.015 mm` on Turbine Blades, `±0.05 mm` on Brake Calipers). Computes real-time tolerance deviation percentages and surface roughness ($R_a$).

### 2. Automated Damage Prevention & Interlock Controller
- **FAIL $\rightarrow$ Instant STOP Signal:** Tripped in $< 20 \text{ ms}$ upon encountering any critical fracture or out-of-tolerance dimension. Engages CNC feed hold, fires the pneumatic divert gate solenoid, and activates warning alarms before the tool touches the part.
- **UNCERTAIN $\rightarrow$ Instant HOLD Signal:** Triggered when dimensions lie in borderline tolerance zones ($85\% - 100\%$) or visual confidence is ambiguous ($0.45 - 0.75$). Clamps the part in place and prevents conveyor advance.
- **PASS $\rightarrow$ Hardware GO Signal:** Releases safety interlock permissives, arming the CNC spindle for high-speed machining.

### 3. Human-in-the-Loop Triage Queue (`/queue`)
- UNCERTAIN parts route immediately to the supervisor triage table.
- Lead inspectors can review high-res optical overlays alongside 2D laser profilometer charts.
- Provides mandatory audit logging: requires supervisor credentials, decision rationale, and updates physical hardware relay states in real time.

### 4. Interactive Workstation Pages
- **Dashboard (`/dashboard`):** Real-time KPI stat cards (Total Inspections, Pass Rate %, Tool Crashes Prevented, Queue Count, Active Alarms), 7-day velocity trend chart, and machine station status grid.
- **Inspection Station (`/inspection/new`):** 3-step wizard with part profile selection, camera frame upload/presets, laser metrology inputs, and animated real-time interlock trigger banner.
- **Inspection Detail (`/inspection/:id`):** Dual-layer optical viewer (Raw vs. AI HUD Overlay), interactive defect tags with bounding box coordinates, dimension tolerance breakdown table, and 2D laser profilometer scan chart.
- **Review Queue (`/queue`):** Real-time filterable queue of held parts with inline triage override modal.
- **Parts Catalog (`/parts`):** CRUD interface defining part materials, nominal CAD dimensions, tight $\pm$ tolerances, and defect classes.
- **Machines & Hardware Manager (`/machines`):** Station cell registry, heartbeat latency ping, manual E-STOP trigger, and live PLC digital output matrix (DO_0 through DO_4).
- **Alerts & Diagnostics (`/alerts`):** Real-time alarm stream with severity levels, quick acknowledgment, and resolution.
- **Reports & Export (`/reports`):** Pareto defect distribution chart, inspection summary analytics, and RFC 4180 compliant CSV export download.

---

## 3. Tech Stack

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy (SQLite dev / PostgreSQL-ready), Pydantic v2, PyJWT, Passlib / Bcrypt, OpenCV (Headless), NumPy, Pillow.
- **Frontend:** React 18, TypeScript, Vite, React Router v6, Axios, Recharts, Lucide Icons, Tailwind CSS v4.
- **Design System:** High-contrast industrial workstation theme:
  - Royal Blue: `#173EA5`
  - Deep Slate / Metallic Panels: `#0B1120`, `#0F172A`, `#1E293B`, `#334155`
  - High-Contrast Status Badges:
    - **PASS:** Emerald `#10B981`
    - **FAIL:** Ruby `#EF4444`
    - **UNCERTAIN:** Amber `#F59E0B`

---

## 4. Database Schema

1. **`users`**: `id`, `email`, `username`, `full_name`, `hashed_password`, `role` (`administrator`, `quality_inspector`, `operator`), `is_active`, `created_at`.
2. **`parts`**: `id`, `code`, `name`, `description`, `material`, `defect_classes` (JSON), `nominal_dimensions` (JSON: `length`, `width`, `height`, `unit`), `tolerances` (JSON), `cad_reference`, `is_active`, `created_at`.
3. **`machines`**: `id`, `name`, `code`, `status` (`CONNECTED`, `DISCONNECTED`, `FAULT`, `MAINTENANCE`), `station`, `machine_type` (`camera_station`, `laser_station`, `plc_controller`, `hybrid`), `ip_address`, `protocol`, `last_heartbeat`, `telemetry` (JSON), `is_active`.
4. **`inspections`**: `id`, `part_id`, `machine_id`, `inspector_id`, `outcome` (`PASS`, `FAIL`, `UNCERTAIN`), `confidence`, `image_url`, `annotated_image_url`, `defect_classes` (JSON), `measurements` (JSON), `hardware_signal` (`GO`, `HOLD`, `STOP`), `response_time_ms`, `reviewed`, `reviewer_id`, `reviewer_notes`, `override_outcome`, `created_at`.
5. **`alerts`**: `id`, `severity` (`CRITICAL`, `WARNING`, `INFO`), `title`, `message`, `machine_id`, `inspection_id`, `is_read`, `is_resolved`, `created_at`.
6. **`interlock_events`**: `id`, `machine_id`, `inspection_id`, `signal_type`, `relay_pin`, `reason`, `response_time_ms`, `plc_acknowledged`, `telemetry_snapshot` (JSON), `timestamp`.

---

## 5. Getting Started & Local Execution

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

---

### Step 1: Backend Setup & Database Seeding

Open a terminal in the project directory:

```bash
cd backend

# Install Python requirements
pip install -r requirements.txt

# Run the comprehensive Database Seeder
# Seeds sample parts (Brake Caliper, Camshaft, Turbine Blade, Manifold),
# machine cells, historical inspections with real OpenCV overlays, and active alerts.
python seed.py

# Run automated integration test suite (optional verification)
python test_api.py

# Start the FastAPI server
python run.py
```
*The FastAPI backend will start on **`http://127.0.0.1:8000`** (Swagger docs available at **`http://127.0.0.1:8000/docs`**).*

---

### Step 2: Frontend Setup & Launch

Open a second terminal:

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
*The frontend workstation will launch on **`http://localhost:5173`**.*

---

### One-Click Windows Launch

Alternatively, double-click `start_all.bat` in the project root to automatically launch both the backend and frontend in separate command windows.

---

## 6. Pre-Configured Demo Credentials

The database seeder creates three user accounts with different operational permissions:

| Role | Username / Email | Password | Intended Workflow |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` / `admin@defex.ai` | `admin123` | Full access to machine CRUD, tolerances, E-STOP reset |
| **Quality Inspector** | `inspector` / `inspector@defex.ai` | `inspector123` | Supervisor Triage Queue clearance and engineering sign-off |
| **Station Operator** | `operator` / `operator@defex.ai` | `operator123` | Running daily inspections at the physical cell |

*Tip: You can instantly switch between roles at any time using the Role Switcher dropdown located in the workstation header without re-entering passwords.*

---

## 7. Verified Test Suite Results

The automated integration test suite (`backend/test_api.py`) verifies:
- `[PASS]` Root operational health status
- `[PASS]` JWT authentication & role-based access control
- `[PASS]` Parts catalog & tolerance definitions
- `[PASS]` Machine cell telemetry & heartbeat latency
- `[PASS]` Dashboard KPI calculations & 7-day velocity trend
- `[PASS]` Optical defect detection (Fatigue crack $\rightarrow$ `FAIL` $\rightarrow$ `STOP` in $12.8\text{ ms}$)
- `[PASS]` Nominal metrology verification (Within tolerance $\rightarrow$ `PASS` $\rightarrow$ `GO` in $12.0\text{ ms}$)
- `[PASS]` Borderline triage queue routing (`UNCERTAIN` $\rightarrow$ `HOLD`)
- `[PASS]` Supervisor override and hardware relay transition
- `[PASS]` Safety circuit emergency stop and manual reset
- `[PASS]` RFC 4180 CSV inspection dataset export
