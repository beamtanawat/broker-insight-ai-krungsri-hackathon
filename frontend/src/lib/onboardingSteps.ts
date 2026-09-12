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
  icon?: string;
  keyHighlight?: string;
}

export interface FeatureCatalogItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  stepIndex: number;
  tag: string;
  highlights: string[];
}

export const BROKER_TOUR_STEPS: TourStep[] = [
  {
    id: "broker-dashboard",
    stepNumber: 1,
    title: "แดชบอร์ด",
    description: "เริ่มต้นวันทำงานอย่างมั่นใจด้วยแดชบอร์ดอัจฉริยะ รวบรวมลูกค้ารายสำคัญ งานติดตามประจำวัน และคำแนะนำกลยุทธ์จาก AI ครบถ้วนในหน้าเดียว",
    route: "/dashboard",
    targetSelector: '[data-tour="dashboard"], [data-tour="dashboard-overview"]',
    placement: "bottom",
    roles: ["broker"],
    tag: "Dashboard",
    icon: "🏠",
    keyHighlight: "⚡ สรุปลูกค้าเร่งด่วนประจำวัน งานติดตามพร้อมระบบเช็คลิสต์ และแนวทางกลยุทธ์จาก AI",
  },
  {
    id: "broker-customers",
    stepNumber: 2,
    title: "ฐานข้อมูลลูกค้า",
    description: "ค้นหาและคัดกรองรายชื่อลูกค้าตามระดับความสำคัญและสถานะความคุ้มครอง ช่วยให้คุณเข้าถึงข้อมูลลูกค้าที่ต้องการดูแลได้อย่างสะดวกรวดเร็ว",
    route: "/customers",
    targetSelector: '[data-tour="customers"], [data-tour="customer-table"]',
    placement: "top",
    roles: ["broker"],
    tag: "Customer Directory",
    icon: "👥",
    keyHighlight: "🔍 ค้นหาด่วนด้วยชื่อหรือรหัสลูกค้า พร้อมตัวกรองระดับความเร่งด่วนและสถานะ KYC",
  },
  {
    id: "broker-customer-360",
    stepNumber: 3,
    title: "Customer 360°",
    description: "เข้าใจลูกค้าลึกซึ้งรอบด้านในมุมมองเดียว ทั้งข้อมูลส่วนบุคคล สินทรัพย์ ภาระหนี้ กรมธรรม์เดิม และวงล้อประเมินความคุ้มครอง 5 มิติ",
    route: "/customers/KS-00001",
    targetSelector: '[data-tour="customer-360"], [data-tour="customer-profile-header"]',
    placement: "bottom",
    roles: ["broker"],
    tag: "Customer 360°",
    icon: "👤",
    keyHighlight: "📋 รวมข้อมูลรอบด้านครบ 5 มิติ ไม่ต้องเสียเวลาสลับเปิดหาจากหลายระบบ",
  },
  {
    id: "broker-ai-insight",
    stepNumber: 4,
    title: "AI ช่วยจัดลำดับความสำคัญ",
    description: "AI ช่วยวิเคราะห์และอธิบายเหตุผลว่า 'ทำไมต้องติดต่อลูกค้ารายนี้ในเวลานี้ (Why Now)' ด้วยโมเดล TreeSHAP แจกแจงปัจจัยสนับสนุนเป็นภาษาไทยอย่างโปร่งใส",
    route: "/customers/KS-00001",
    targetSelector: '[data-tour="ai-insight"], [data-tour="ai-priority-card"]',
    placement: "left",
    roles: ["broker"],
    tag: "TreeSHAP Explainability",
    icon: "🧠",
    keyHighlight: "💡 เข้าใจที่มาของคะแนนความเร่งด่วน พร้อมคำอธิบายปัจจัยสำคัญแบบโปร่งใส ไร้กล่องดำ",
  },
  {
    id: "broker-recommendations",
    stepNumber: 5,
    title: "คำแนะนำสำหรับลูกค้า",
    description: "ระบบช่วยคัดกรองคุณสมบัติผลิตภัณฑ์ 100% (Hard Eligibility Gate) ป้องกันการนำเสนอผิดเงื่อนไข โดยนายหน้ายังคงเป็นผู้พิจารณาตัดสินใจขั้นสุดท้ายเสมอ",
    route: "/customers/KS-00001",
    targetSelector: '[data-tour="recommendation"], [data-tour="product-recommendations"]',
    placement: "top",
    roles: ["broker"],
    tag: "Hard Eligibility Gate",
    icon: "🛡️",
    keyHighlight: "✅ กรองคุณสมบัติตายตัว 100% ป้องกันข้อเสนอผิดเกณฑ์ พร้อมเปิดให้นายหน้าตัดสินใจเอง",
  },
  {
    id: "broker-nearby",
    stepNumber: 6,
    title: "ลูกค้าใกล้เคียง",
    description: "ค้นหาลูกค้าที่อยู่ใกล้เคียงตำแหน่งของคุณในรัศมี 5, 10 หรือ 20 กม. พร้อมแสดงระยะทางจริงและระดับความสำคัญ ช่วยให้คุณวางแผนเข้าพบลูกค้าได้อย่างคุ้มค่าเวลา",
    route: "/visit-planner",
    targetSelector: '[data-tour="nearby-customers"], [data-tour="nearby-customers-map"]',
    placement: "right",
    roles: ["broker"],
    tag: "Proximity Map",
    icon: "📍",
    keyHighlight: "🗺️ Proximity Map เรดาร์พิกัดจริง ช่วยให้นายหน้าวางแผนเข้าพบลูกค้าในพื้นที่ได้อย่างคุ้มค่าเวลา",
  },
  {
    id: "broker-manual-selection",
    stepNumber: 7,
    title: "คุณเป็นคนเลือก",
    description: "ระบบเคารพการตัดสินใจของคุณ 100% โดย AI ทำหน้าที่เป็นเพียงผู้ช่วยนำเสนอข้อมูล แต่คุณเป็นผู้เลือกเองว่าจะไปพบลูกค้ารายใด ในเวลาใดที่เหมาะสมที่สุด",
    route: "/visit-planner",
    targetSelector: '[data-tour="customer-selection"], [data-tour="customer-selection-action"]',
    placement: "left",
    roles: ["broker"],
    tag: "Broker Decision",
    icon: "✋",
    keyHighlight: "⚖️ นายหน้าเป็นผู้ตัดสินใจขั้นสุดท้ายเสมอ อิสระ 100% (Human Autonomy)",
  },
  {
    id: "broker-navigation",
    stepNumber: 8,
    title: "นำทางเมื่อต้องการ",
    description: "เมื่อคุณเลือกลูกค้าที่ต้องการพบแล้ว สามารถกดเปิด Google Maps เพื่อนำทางไปยังจุดหมายได้ทันทีแบบ On-Demand สะดวกและแม่นยำสำหรับการเดินทางจริง",
    route: "/visit-planner",
    targetSelector: '[data-tour="navigation"], [data-tour="navigation-preview-action"]',
    placement: "top",
    roles: ["broker"],
    tag: "On-Demand Navigation",
    icon: "🧭",
    keyHighlight: "🚗 ปุ่มเปิด Google Maps นำทางจริงแบบ On-Demand สะดวก รวดเร็ว เมื่อพร้อมออกเดินทาง",
  },
  {
    id: "broker-analytics",
    stepNumber: 9,
    title: "Analytics",
    description: "ติดตามผลการดำเนินงานและสถิติภาพรวมความสำเร็จ ดูอัตราการตอบรับข้อเสนอ การกระจายตัวของช่องว่างความคุ้มครอง และส่งออกรายงาน CSV ภาษาไทยได้ง่ายดาย",
    route: "/analytics",
    targetSelector: '[data-tour="analytics"], [data-tour="analytics-overview"]',
    placement: "bottom",
    roles: ["broker"],
    tag: "Analytics & Governance",
    icon: "📊",
    keyHighlight: "📈 ติดตามความสำเร็จในการดูแลลูกค้า และส่งออกรายงานสรุปผลงานภาษาไทยได้ทันที",
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
    icon: "🏠",
    keyHighlight: "📊 ศูนย์รวมดัชนีชี้วัดความคืบหน้าของทีมงานทั้งหมด",
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
    icon: "👥",
    keyHighlight: "🔍 ติดตามสุขภาพพอร์ตโฟลิโอและสถานะการตรวจสอบ KYC",
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
    icon: "🛡️",
    keyHighlight: "🎯 ชี้เป้าลูกค้าที่ยังขาดความคุ้มครองหลักเพื่อวางกลยุทธ์ทีม",
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
    icon: "🧠",
    keyHighlight: "📈 วัดผล Conversion Rate และผลตอบรับของคำแนะนำจาก AI",
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
    icon: "📑",
    keyHighlight: "⚖️ ควบคุมมาตรฐานการให้คำปรึกษาที่โปร่งใสและตรวจสอบได้",
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
    icon: "⚡",
    keyHighlight: "🖥️ ควบคุมและตรวจสอบความพร้อมใช้งานของทุก Microservice",
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
    icon: "🔬",
    keyHighlight: "🎯 ตรวจสอบความแม่นยำ F1, ROC-AUC, ECE และการกระจายตัวของข้อมูล",
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
    icon: "⚖️",
    keyHighlight: "🔍 อธิบายได้ทุกการทำนาย ปราศจากความเสี่ยงทางจริยธรรม AI",
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
    icon: "📜",
    keyHighlight: "🔒 บันทึกข้อมูลที่แก้ไขไม่ได้ (Immutable Audit Trail) 100%",
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
    icon: "🧪",
    keyHighlight: "🚦 เครื่องมือวัดผลและทดสอบความพร้อมในสภาพแวดล้อม Sandbox",
  },
];

export const FEATURE_CATALOG_ITEMS: FeatureCatalogItem[] = [
  {
    id: "feat-dashboard",
    title: "1. แดชบอร์ด & คิวงานด่วน AI",
    subtitle: "เริ่มต้นวันทำงานอย่างมั่นใจ รวบรวมลูกค้ารายสำคัญ งานติดตาม และกลยุทธ์จาก AI ไว้ในหน้าเดียว",
    icon: "🏠",
    route: "/dashboard",
    stepIndex: 0,
    tag: "Daily Cockpit",
    highlights: [
      "คัดกรองลูกค้าระดับความสำคัญสูงประจำวัน เพื่อการดูแลที่ตรงเวลา",
      "ระบบเช็คลิสต์งานติดตาม (Follow-up Tasks) บันทึกผลได้ทันที",
      "สรุปแนวทางและข้อเสนอแนะกลยุทธ์ยามเช้าจาก AI อัจฉริยะ",
    ],
  },
  {
    id: "feat-customers",
    title: "2. ฐานข้อมูลลูกค้า & ค้นหาอัจฉริยะ",
    subtitle: "ค้นหาและจัดการรายชื่อลูกค้าอย่างมีประสิทธิภาพ คัดกรองตามระดับความเร่งด่วนและสถานะ KYC",
    icon: "👥",
    route: "/customers",
    stepIndex: 1,
    tag: "Customer Directory",
    highlights: [
      "ค้นหาด่วนด้วยชื่อ นามสกุล หรือรหัสลูกค้าแบบเรียลไทม์",
      "จัดหมวดหมู่ลูกค้าตามระดับความเร่งด่วน (Urgent / High / Medium)",
      "เข้าถึงโปรไฟล์และประวัติการดูแลของลูกค้าแต่ละรายได้ในคลิกเดียว",
    ],
  },
  {
    id: "feat-customer-360",
    title: "3. ข้อมูลลูกค้า 360° & Gap ความคุ้มครอง",
    subtitle: "เข้าใจลูกค้าลึกซึ้งรอบด้าน ทั้งสินทรัพย์ ภาระหนี้ กรมธรรม์เดิม และวงล้อประเมินความเสี่ยง 5 มิติ",
    icon: "👤",
    route: "/customers/KS-00001",
    stepIndex: 2,
    tag: "Customer 360°",
    highlights: [
      "วงล้อเรดาร์วิเคราะห์ความคุ้มครองครบ 5 มิติ (ชีวิต สุขภาพ อุบัติเหตุ โรคร้ายแรง เกษียณ)",
      "รวบรวมประวัติกรมธรรม์เดิมและยอดเบี้ยประกันไว้ในหน้าจอเดียว",
      "ชี้เป้าช่องว่างความคุ้มครอง (Coverage Gap) ที่ลูกค้ายังขาดอยู่เพื่อเตรียมการสนทนา",
    ],
  },
  {
    id: "feat-ai-insight",
    title: "4. AI Why Now & ปัจจัยวิเคราะห์ TreeSHAP",
    subtitle: "เข้าใจเหตุผลชัดเจนว่าทำไมควรติดต่อลูกค้าตอนนี้ ด้วยคำอธิบายภาษาไทยที่โปร่งใส ไม่ใช่กล่องดำ",
    icon: "🧠",
    route: "/customers/KS-00001",
    stepIndex: 3,
    tag: "TreeSHAP Explainability",
    highlights: [
      "อธิบายที่มาของคะแนนความเร่งด่วนอย่างละเอียด เป็นภาษาไทยที่เข้าใจง่าย",
      "แจกแจงปัจจัยเชิงบวกและปัจจัยที่ควรระวังด้วยโมเดล TreeSHAP",
      "ตรวจสอบความโปร่งใสของเหตุผล AI ได้ทุกขั้นตอน ไร้อคติและมีธรรมาภิบาล",
    ],
  },
  {
    id: "feat-recommendations",
    title: "5. คำแนะนำผลิตภัณฑ์คัดกรอง 100%",
    subtitle: "แนะนำผลิตภัณฑ์ที่ตรงกับความจำเป็นของลูกค้า พร้อมคัดกรองคุณสมบัติ 0% ข้อเสนอผิดเกณฑ์",
    icon: "🛡️",
    route: "/customers/KS-00001",
    stepIndex: 4,
    tag: "Hard Eligibility Gate",
    highlights: [
      "Hard Eligibility Gate ตรวจสอบอายุ อาชีพ และเงื่อนไขตายตัว 100% ก่อนแนะนำ",
      "จับคู่ผลิตภัณฑ์ที่ช่วยอุดช่องว่างความคุ้มครอง (Coverage Gap) ของลูกค้าตรงจุด",
      "นายหน้าเป็นผู้พิจารณากดตอบรับหรือปฏิเสธข้อเสนอ (พร้อมระบุเหตุผล) ด้วยตนเอง",
    ],
  },
  {
    id: "feat-nearby",
    title: "6. แผนที่ลูกค้าใกล้เคียงตามพิกัดจริง",
    subtitle: "Proximity Radar ค้นหาลูกค้ารอบตัวในรัศมี 5, 10, 20 กม. ช่วยวางแผนการเดินทางอย่างคุ้มค่า",
    icon: "📍",
    route: "/visit-planner",
    stepIndex: 5,
    tag: "Proximity Map",
    highlights: [
      "แผนที่เรดาร์แสดงตำแหน่งลูกค้า สำนักงาน และระยะทางจริงแบบแม่นยำ",
      "ปรับเลือกรัศมีการค้นหา 5, 10 หรือ 20 กม. ได้ตามแผนงานประจำวัน",
      "แสดงระดับความเร่งด่วนของลูกค้าแต่ละรายบนแผนที่ ช่วยให้เห็นภาพรวมทันที",
    ],
  },
  {
    id: "feat-selection",
    title: "7. อิสระในการตัดสินใจ (คุณเป็นคนเลือก)",
    subtitle: "AI ทำหน้าที่เป็นผู้ช่วยวิเคราะห์ข้อมูล แต่นายหน้าเป็นผู้มีอำนาจตัดสินใจเลือกเอง 100%",
    icon: "✋",
    route: "/visit-planner",
    stepIndex: 6,
    tag: "Broker Autonomy",
    highlights: [
      "คุณเป็นผู้เลือกเองอย่างอิสระว่าจะเข้าพบลูกค้ารายใดและในเวลาใด",
      "ไม่มีการจัดคิวอัตโนมัติหรือบังคับตารางเวลาของนายหน้า",
      "สนับสนุนบทบาทที่ปรึกษามืออาชีพด้วยข้อมูลสนับสนุนที่รอบด้าน",
    ],
  },
  {
    id: "feat-navigation",
    title: "8. ระบบนำทางจริง Google Maps On-Demand",
    subtitle: "เชื่อมต่อการนำทางจริงไปยังพิกัดลูกค้าในคลิกเดียว เมื่อคุณพร้อมออกเดินทางเข้าพบ",
    icon: "🧭",
    route: "/visit-planner",
    stepIndex: 7,
    tag: "On-Demand Navigation",
    highlights: [
      "เปิด Google Maps นำทางจริงแบบจุดต่อจุดได้ใน 1 คลิก",
      "คำนวณระยะทางและเวลาเดินทางจริงจากสภาพการจราจรแบบเรียลไทม์",
      "รองรับการเปิดใช้งานบนสมาร์ตโฟนและแท็บเล็ตขณะลงพื้นที่จริงได้อย่างราบรื่น",
    ],
  },
  {
    id: "feat-analytics",
    title: "9. ศูนย์วิเคราะห์ผลงานและสถิติธุรกิจ",
    subtitle: "ติดตามความสำเร็จของการดูแลลูกค้า วิเคราะห์อัตราการตอบรับข้อเสนอ และส่งออกรายงานได้ทันที",
    icon: "📊",
    route: "/analytics",
    stepIndex: 8,
    tag: "Business Analytics",
    highlights: [
      "ติดตามอัตราการตอบรับคำแนะนำผลิตภัณฑ์ (Conversion Funnel) อย่างชัดเจน",
      "วิเคราะห์ภาพรวมการปิดช่องว่างความคุ้มครอง (Coverage Gap) ในพอร์ตลูกค้า",
      "ส่งออกรายงานสรุปผลการดำเนินงานเป็นไฟล์ CSV ภาษาไทยเพื่อนำไปใช้งานต่อได้ทันที",
    ],
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
