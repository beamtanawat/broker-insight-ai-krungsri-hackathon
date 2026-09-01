# Broker Insight AI — Design System

> Enterprise AI Decision Support Workspace for Brokers  
> Version: Phase 33.2 · Krungsri Financial Advisory

---

## Design Principles

| Principle | Application |
|-----------|-------------|
| **Human** | Broker remains responsible. AI assists, never decides. |
| **Trusted** | AI output is visually distinct from verified data. |
| **Simple** | Technical complexity is behind progressive disclosure. |
| **Actionable** | Primary actions are visually dominant. Information is secondary. |

---

## Color Tokens

Defined in `frontend/src/app/globals.css` as CSS custom properties.

### Enterprise Palette

| Token | Value | Use |
|-------|-------|-----|
| `--primary-700` | `#1d4b80` | Primary actions, active nav, key text |
| `--primary-500` | `#3b82f6` | Accent, badges |
| `--primary-50`  | `#eff6ff` | Selected state backgrounds |
| `--slate-900`   | `#0f172a` | Primary text |
| `--slate-600`   | `#475569` | Secondary text |
| `--slate-400`   | `#94a3b8` | Muted / disabled text |
| `--bg-app`      | `#f4f6f9` | Page background |
| `--bg-surface`  | `#ffffff` | Card / panel background |
| `--bg-sidebar`  | `#0b1e36` | Sidebar |

### Semantic Colors

| Token | Meaning | Examples |
|-------|---------|---------|
| `--success-*` | Completed · Approved · Eligible · Healthy | Approved decision, KYC verified |
| `--warning-*` | Needs review · Pending · Missing info | Pending KYC, medium priority |
| `--danger-*`  | Blocked · Rejected · Ineligible · Critical | Rejected, gating failure |
| `--info-*`    | Informational · AI-generated · Evidence | AI recommendation label |

### AI Visual Language Tokens

These tokens are **mandatory** for distinguishing content provenance.

| Token Group | Meaning | Component |
|-------------|---------|-----------|
| `--ai-*`       | AI-generated (ML/LLM output) | `AILabel type="ai"`, `Panel variant="ai"` |
| `--verified-*` | Confirmed customer data | `AILabel type="verified"`, `Panel variant="verified"` |
| `--broker-*`   | Human broker decision | `AILabel type="broker"`, `Panel variant="broker"` |
| `--rule-*`     | Deterministic system rule | `AILabel type="rule"`, `Panel variant="rule"` |

> ⚠️ **Rule**: Never display AI-generated content and verified customer data in identical visual containers.

---

## Typography

Font: **Inter** (Google Fonts) with system fallbacks including `Leelawadee UI` for Thai.

| Token | Size | Use |
|-------|------|-----|
| `--fs-xs`   | 12px | Metadata, captions, labels |
| `--fs-sm`   | 13px | Secondary body, table cells |
| `--fs-base` | 14px | Primary body text |
| `--fs-md`   | 16px | Card titles, subtitles |
| `--fs-lg`   | 18px | Customer name, section headers |
| `--fs-xl`   | 20px | Page titles |
| `--fs-2xl`  | 24px | KPI numbers |
| `--fs-3xl`  | 30px | Priority Score display |

**Reserved numeric sizes**: `--fs-2xl` and `--fs-3xl` are for primary KPIs only. Do not use them for decorative numbers.

---

## Spacing

8-point grid system. All spacing should use tokens.

| Token | Value | Use |
|-------|-------|-----|
| `--space-1` | 4px  | Icon gap, tight inline |
| `--space-2` | 8px  | Button gap, compact list |
| `--space-3` | 12px | Card inner padding (compact), badge padding |
| `--space-4` | 16px | Form fields, table cell padding |
| `--space-5` | 20px | Card padding, section spacing |
| `--space-6` | 24px | Page padding, section gap |
| `--space-8` | 32px | Major section breaks |

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm`   | 6px    | Input fields, small buttons |
| `--radius-md`   | 8px    | Buttons, form elements, panels |
| `--radius-lg`   | 12px   | Cards, modals, drawers |
| `--radius-full` | 9999px | Badges, pills, status indicators |

---

## Shadow

| Token | Use |
|-------|-----|
| `--shadow-xs` | Card resting state (very subtle) |
| `--shadow-sm` | Hover state |
| `--shadow-md` | Dropdowns, popovers |
| `--shadow-lg` | Modals, drawers |

Most surfaces use `--shadow-xs` or borders only. Heavy shadows are reserved for overlay elements.

---

## Motion

| Token | Duration | Use |
|-------|----------|-----|
| `--motion-fast`   | 120ms | Hover, focus, icon changes |
| `--motion-base`   | 200ms | Tab switches, panel transitions |
| `--motion-slow`   | 350ms | Complex state changes |
| `--motion-spring` | 400ms | Reserved for future spring animations |

**All animations must respect `prefers-reduced-motion`** — handled globally in `globals.css`.

---

## Components

### Button

```tsx
<Button variant="primary" size="md">เปิดลูกค้า</Button>
<Button variant="secondary">ดูทั้งหมด</Button>
<Button variant="approve" leftIcon="✓">เห็นชอบ</Button>
<Button variant="modify" leftIcon="✎">ปรับเปลี่ยน</Button>
<Button variant="reject" leftIcon="✕">ปฏิเสธ</Button>
<Button variant="ghost">ยกเลิก</Button>
<Button isLoading>กำลังวิเคราะห์...</Button>
```

**Hierarchy rule**: One primary action per view. Secondary actions are `outline` or `ghost`.

### Badge

```tsx
<Badge variant="high">สูง</Badge>
<Badge variant="success" dot>Eligible</Badge>
<Badge variant="ai" size="sm">AI</Badge>
```

### Card

```tsx
<Card title="KPI Title" variant="metric">...</Card>
<Card title="AI Insight" variant="insight">...</Card>
<Card title="Quick Action" variant="action">...</Card>
```

Variants add left-border color treatment. Default has no variant accent.

### Panel (AI Visual Language)

```tsx
<Panel variant="ai" label="AI Insight" title="สรุปพฤติกรรมลูกค้า">
  {/* AI-generated content */}
</Panel>

<Panel variant="verified" label="ข้อมูลที่ยืนยันแล้ว">
  {/* KYC-verified customer data */}
</Panel>

<Panel variant="broker" label="การตัดสินใจของนายหน้า">
  {/* Recorded broker decision */}
</Panel>
```

### AILabel (Inline provenance tag)

```tsx
<AILabel type="ai" />           {/* ⚡ AI Insight */}
<AILabel type="verified" />     {/* ✓ ข้อมูลที่ยืนยันแล้ว */}
<AILabel type="broker" />       {/* 👤 การตัดสินใจของนายหน้า */}
<AILabel type="rule" />         {/* ⚙ กฎระบบ */}
```

### Status

```tsx
<Status variant="healthy" />                    {/* ● Healthy */}
<Status variant="warning" label="ตรวจสอบ" />   {/* ▲ ตรวจสอบ */}
<Status variant="critical" size="sm" />         {/* ✕ Critical */}
```

Always icon + text — never color alone (WCAG 1.4.1).

### PriorityScore

```tsx
{/* Full display — Customer 360 */}
<PriorityScore score={87} priority="high" confidence="high" />

{/* Compact — tables */}
<PriorityScore score={72} priority="medium" compact />
```

Confidence level is always shown. Never implies certainty.

### Drawer

```tsx
<Drawer isOpen={open} onClose={() => setOpen(false)} title="SHAP Explanation">
  {/* Technical detail content */}
</Drawer>
```

Use for: technical AI explanation, recommendation comparison, customer activity detail.

### Tooltip

```tsx
<Tooltip content="F1-Score: ตัวชี้วัดที่รวม Precision และ Recall เข้าด้วยกัน">
  <span style={{ borderBottom: "1px dashed var(--slate-300)", cursor: "help" }}>F1</span>
</Tooltip>
```

Use for technical terms in analytics/model pages.

---

## AI Visual Language

### The Four Content Types

Every piece of information shown to a broker must be one of these types:

| Type | Icon | Color | Meaning |
|------|------|-------|---------|
| AI Insight | ⚡ | Indigo `--ai-*` | Generated by ML model or LLM |
| Verified Data | ✓ | Green `--verified-*` | Confirmed customer record |
| Broker Decision | 👤 | Amber `--broker-*` | Recorded by human broker |
| System Rule | ⚙ | Gray `--rule-*` | Deterministic eligibility/compliance |

### Approved Language

| ✅ Use | ❌ Avoid |
|--------|---------|
| "AI Insight" | "AI Truth" |
| "AI Recommendation" | "Best Product" |
| "Potential Need" | "Guaranteed Need" |
| "Broker Decision" | "Final Answer" |
| "ความมั่นใจ: สูง" | "Accuracy: 100%" |

---

## Accessibility

- All interactive elements must have visible focus states (`:focus-visible` with `--focus-ring`)
- Status information must use icon + text, not color alone
- All images/icons must have `aria-hidden="true"` or meaningful `alt`
- Modals must have `aria-modal="true"` and focus trap
- Tabs must use `role="tablist"` / `role="tab"` and support ArrowLeft/ArrowRight
- Drawers close on Escape and focus the first element on open
- Reduced motion: all animations respect `prefers-reduced-motion: reduce`

---

## Navigation

### Role Visibility

| Section | Broker | Manager | Admin |
|---------|--------|---------|-------|
| Workspace (Dashboard, Chat) | ✅ | ✅ | ✅ |
| Operations (Analytics, AI Health, Pilot) | ❌ | ✅ | ✅ |
| Administration (Audit) | ❌ | ❌ | ✅ |

### Sidebar Behavior

- Desktop (≥1024px): persistent sidebar, collapsible to icon-only
- Mobile (<1024px): hidden sidebar, hamburger in topbar, overlay drawer

---

## File Structure

```
frontend/src/components/
├── ui/           ← Primitives: Button, Badge, Card, Alert, Modal, Tabs,
│                    Table, Skeleton, EmptyState, Drawer, Tooltip, Panel, Status
├── layout/       ← AppShell, Sidebar, Topbar
├── navigation/   ← Breadcrumb
└── domain/       ← PageHeader, PriorityScore, CustomerHeader, AILabel
```

---

## DO NOT

- Use arbitrary hex colors directly in components — always use tokens
- Show AI-generated content in the same visual container as verified customer data
- Make every button visually dominant — apply hierarchy
- Use `--fs-2xl` or `--fs-3xl` for decorative numbers
- Use color as the only conveyor of status information
- Skip `aria-label` on icon-only buttons
