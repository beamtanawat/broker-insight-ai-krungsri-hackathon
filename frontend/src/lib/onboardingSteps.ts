export interface TourStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  route?: string;
  targetSelector?: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  roles: ("broker" | "manager" | "admin")[];
  tag?: string;
}

export const BROKER_TOUR_STEPS: TourStep[] = [
  {
    id: "broker-dashboard",
    stepNumber: 1,
    title: "แดชบอร์ดของคุณ",
    description: "ดูภาพรวมลูกค้า Priority งานติดตาม และข้อมูลสำคัญที่ควรให้ความสนใจได้จากหน้าเดียว",
    route: "/dashboard",
    targetSelector: '[data-tour="dashboard-overview"]',
    placement: "bottom",
    roles: ["broker"],
    tag: "Dashboard",
  },
  {
    id: "broker-customers",
    stepNumber: 2,
    title: "จัดการและค้นหาลูกค้า",
    description: "ค้นหาและกรองลูกค้าตาม Priority, สถานะ และข้อมูลที่เกี่ยวข้อง เพื่อเข้าถึงลูกค้าที่ต้องการได้รวดเร็วขึ้น",
    route: "/customers",
    targetSelector: '[data-tour="customer-table"]',
    placement: "top",
    roles: ["broker"],
    tag: "Customer Directory",
  },
  {
    id: "broker-customer-360",
    stepNumber: 3,
    title: "รู้จักลูกค้าในมุมมอง 360°",
    description: "ดูข้อมูลลูกค้าในภาพรวม ทั้งข้อมูลส่วนบุคคล สินทรัพย์ หนี้สิน กรมธรรม์ ความคุ้มครอง และประวัติการติดต่อ",
    route: "/customers/1",
    targetSelector: '[data-tour="customer-profile-header"]',
    placement: "bottom",
    roles: ["broker"],
    tag: "Customer 360",
  },
  {
    id: "broker-ai-insight",
    stepNumber: 4,
    title: "AI ช่วยวิเคราะห์ลูกค้า",
    description: "AI ช่วยจัดลำดับความสำคัญ พร้อมแสดงเหตุผลว่า “ทำไมลูกค้าคนนี้ถึงควรได้รับความสนใจตอนนี้”",
    route: "/customers/1",
    targetSelector: '[data-tour="ai-priority-card"]',
    placement: "left",
    roles: ["broker"],
    tag: "Decision Support",
  },
  {
    id: "broker-recommendations",
    stepNumber: 5,
    title: "คำแนะนำที่เหมาะกับลูกค้า",
    description: "ระบบช่วยวิเคราะห์ความต้องการและตรวจสอบ Eligibility ก่อนแนะนำผลิตภัณฑ์ที่เกี่ยวข้อง โดยนายหน้ายังคงเป็นผู้ตัดสินใจขั้นสุดท้าย",
    route: "/customers/1",
    targetSelector: '[data-tour="product-recommendations"]',
    placement: "top",
    roles: ["broker"],
    tag: "Product Match",
  },
  {
    id: "broker-nearby",
    stepNumber: 6,
    title: "ค้นหาลูกค้าที่อยู่ใกล้คุณ",
    description: "ใช้ตำแหน่งปัจจุบันของคุณเพื่อค้นหาลูกค้าในบริเวณใกล้เคียง พร้อมดู Priority, Why Now และระยะทาง",
    route: "/visit-planner",
    targetSelector: '[data-tour="nearby-customers-map"]',
    placement: "right",
    roles: ["broker"],
    tag: "Proximity Map",
  },
  {
    id: "broker-manual-selection",
    stepNumber: 7,
    title: "คุณเป็นคนเลือก",
    description: "AI ช่วยให้ข้อมูลประกอบการตัดสินใจ แต่คุณเป็นผู้เลือกเองว่าจะไปพบลูกค้ารายใด",
    route: "/visit-planner",
    targetSelector: '[data-tour="customer-selection-action"]',
    placement: "left",
    roles: ["broker"],
    tag: "Broker In Control",
  },
  {
    id: "broker-navigation",
    stepNumber: 8,
    title: "นำทางเมื่อพร้อม",
    description: "เมื่อคุณเลือกลูกค้าแล้ว ระบบจะแสดงเส้นทางจากตำแหน่งปัจจุบันไปยังลูกค้ารายนั้น พร้อมระยะทางและเวลาเดินทางโดยประมาณ",
    route: "/visit-planner",
    targetSelector: '[data-tour="navigation-preview-action"]',
    placement: "top",
    roles: ["broker"],
    tag: "On-Demand Nav",
  },
  {
    id: "broker-analytics",
    stepNumber: 9,
    title: "ดูผลการดำเนินงาน",
    description: "ดูข้อมูลวิเคราะห์และภาพรวมการทำงานของระบบเพื่อช่วยติดตามประสิทธิภาพ",
    route: "/analytics",
    targetSelector: '[data-tour="analytics-overview"]',
    placement: "bottom",
    roles: ["broker"],
    tag: "Analytics",
  },
];

export const MANAGER_TOUR_STEPS: TourStep[] = [
  {
    id: "manager-dashboard",
    stepNumber: 1,
    title: "แดชบอร์ดภาพรวมการดำเนินงาน",
    description: "ติดตามภาพรวมประสิทธิภาพการทำงานของทีม สถิติลูกค้ากลุ่มเป้าหมาย และเป้าหมายประจำวัน",
    route: "/dashboard",
    targetSelector: '[data-tour="dashboard-overview"]',
    placement: "bottom",
    roles: ["manager"],
    tag: "Executive View",
  },
  {
    id: "manager-pipeline",
    stepNumber: 2,
    title: "ภาพรวมการวิเคราะห์ลูกค้า",
    description: "ตรวจสอบการกระจายตัวของลูกค้าในพอร์ตโฟลิโอ สถานะความเร่งด่วน และการเข้าพบของทีมงาน",
    route: "/customers",
    targetSelector: '[data-tour="customer-table"]',
    placement: "top",
    roles: ["manager"],
    tag: "Customer Pipeline",
  },
  {
    id: "manager-coverage-gap",
    stepNumber: 3,
    title: "การประเมินความเสี่ยงและช่องว่างความคุ้มครอง",
    description: "วิเคราะห์ช่องว่างความคุ้มครอง (Coverage Gap) ของลูกค้า เพื่อระบุโอกาสทางการตลาดและการบริการเชิงรุก",
    route: "/analytics",
    targetSelector: '[data-tour="analytics-overview"]',
    placement: "bottom",
    roles: ["manager"],
    tag: "Gap Analysis",
  },
  {
    id: "manager-ai-insights",
    stepNumber: 4,
    title: "ระบบ AI Insight & ติดตามประสิทธิภาพทีม",
    description: "ติดตามความแม่นยำของคำแนะนำ AI อัตราการตอบรับข้อเสนอ และแนวโน้มความพึงพอใจของลูกค้า",
    route: "/analytics",
    targetSelector: '[data-tour="analytics-overview"]',
    placement: "top",
    roles: ["manager"],
    tag: "Team Metrics",
  },
  {
    id: "manager-reports",
    stepNumber: 5,
    title: "การกำกับดูแลและรายงานเชิงลึก",
    description: "เข้าถึงรายงานเชิงลึกเพื่อการตัดสินใจเชิงกลยุทธ์ พร้อมรองรับการตรวจสอบมาตรฐานการทำงาน",
    route: "/analytics",
    targetSelector: '[data-tour="analytics-overview"]',
    placement: "bottom",
    roles: ["manager"],
    tag: "Governance",
  },
];

export const ADMIN_TOUR_STEPS: TourStep[] = [
  {
    id: "admin-dashboard",
    stepNumber: 1,
    title: "ศูนย์กลางการควบคุมระบบ",
    description: "ภาพรวมสถานะการทำงานของระบบ การเชื่อมต่อ AI Engine และความพร้อมใช้งานของบริการ",
    route: "/dashboard",
    targetSelector: '[data-tour="dashboard-overview"]',
    placement: "bottom",
    roles: ["admin"],
    tag: "System Status",
  },
  {
    id: "admin-model-monitoring",
    stepNumber: 2,
    title: "การตรวจสอบความสมบูรณ์ของโมเดล AI",
    description: "ตรวจสอบประสิทธิภาพโมเดล LightGBM Champion, การปรับเทียบ Platt Sigmoid และติดตามการเลื่อนของข้อมูล (PSI Drift)",
    route: "/model",
    targetSelector: '[data-tour="model-metrics"]',
    placement: "bottom",
    roles: ["admin"],
    tag: "Model Health",
  },
  {
    id: "admin-shap",
    stepNumber: 3,
    title: "ความโปร่งใสและคำอธิบายโมเดล",
    description: "ตรวจสอบ Feature Attribution ผ่าน SHAP TreeExplainer เพื่อรับประกันความโปร่งใสและไร้อคติในการประเมินผล",
    route: "/model",
    targetSelector: '[data-tour="model-shap"]',
    placement: "top",
    roles: ["admin"],
    tag: "XAI & Ethics",
  },
  {
    id: "admin-audit",
    stepNumber: 4,
    title: "บันทึกประวัติการตรวจสอบย้อนกลับ",
    description: "บันทึกทุกคำสั่งการอนุมาน (Inference), คำสั่ง LLM และการตัดสินใจของผู้ใช้ เพื่อการกำกับดูแลตามข้อกำหนด",
    route: "/admin/audit",
    targetSelector: '[data-tour="audit-log-table"]',
    placement: "top",
    roles: ["admin"],
    tag: "Compliance Log",
  },
  {
    id: "admin-pilot",
    stepNumber: 5,
    title: "การทดสอบนำร่องและการจำลองสถานการณ์",
    description: "จำลองสถานการณ์ทดสอบ 8 รูปแบบเพื่อประเมินความพร้อมและเสถียรภาพของระบบก่อนการปรับใช้จริง",
    route: "/pilot",
    targetSelector: '[data-tour="pilot-sandbox"]',
    placement: "bottom",
    roles: ["admin"],
    tag: "Pilot Sandbox",
  },
];

export function getTourStepsForRole(role?: string): TourStep[] {
  switch (role) {
    case "admin":
      return ADMIN_TOUR_STEPS;
    case "manager":
      return MANAGER_TOUR_STEPS;
    case "broker":
    default:
      return BROKER_TOUR_STEPS;
  }
}
