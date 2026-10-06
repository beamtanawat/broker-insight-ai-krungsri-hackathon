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
    description: "ยินดีต้อนรับสู่จุดเริ่มต้นวันทำงานของคุณครับ! หน้านี้รวบรวมรายชื่อลูกค้าที่ควรติดต่อเร่งด่วนประจำวัน งานติดตามที่ต้องทำ และข้อเสนอแนะกลยุทธ์จาก AI ช่วยให้คุณเริ่มต้นวันได้อย่างมั่นใจ ไม่พลาดทุกโอกาสสำคัญ",
    route: "/dashboard",
    targetSelector: '[data-tour="dashboard"], [data-tour="dashboard-overview"]',
    placement: "bottom",
    roles: ["broker"],
    tag: "แดชบอร์ดเริ่มต้นวัน",
    icon: "🏠",
    keyHighlight: "⚡ สรุปลูกค้าเร่งด่วนประจำวัน งานติดตามพร้อมระบบเช็คลิสต์ และแนวทางกลยุทธ์จาก AI ครบในที่เดียว",
  },
  {
    id: "broker-customers",
    stepNumber: 2,
    title: "ฐานข้อมูลลูกค้า",
    description: "ศูนย์รวมข้อมูลลูกค้าทั้งหมดของคุณ ค้นหารายชื่อได้สะดวกรวดเร็ว คัดกรองตามระดับความสำคัญหรือสถานะความคุ้มครอง ช่วยให้คุณเข้าถึงประวัติและข้อมูลที่ต้องการดูแลได้อย่างรวดเร็วในคลิกเดียว",
    route: "/customers",
    targetSelector: '[data-tour="customers"], [data-tour="customer-table"]',
    placement: "top",
    roles: ["broker"],
    tag: "ฐานข้อมูลลูกค้า",
    icon: "👥",
    keyHighlight: "🔍 ค้นหาด่วนด้วยชื่อหรือรหัสลูกค้า พร้อมตัวกรองแยกตามระดับความเร่งด่วนและสถานะการยืนยันตัวตน",
  },
  {
    id: "broker-customer-360",
    stepNumber: 3,
    title: "Customer 360°",
    description: "เข้าใจลูกค้าคนสำคัญอย่างลึกซึ้งรอบด้านในหน้าเดียว ทั้งข้อมูลครอบครัว สินทรัพย์ ภาระหนี้ กรมธรรม์เดิม และวงล้อประเมินความคุ้มครอง 5 มิติ เพื่อให้คุณเตรียมตัวพูดคุยได้อย่างตรงใจและเป็นมืออาชีพที่สุด",
    route: "/customers/KS-00001",
    targetSelector: '[data-tour="customer-360"], [data-tour="customer-profile-header"]',
    placement: "bottom",
    roles: ["broker"],
    tag: "ภาพรวมลูกค้า 360°",
    icon: "👤",
    keyHighlight: "📋 รวบรวมข้อมูลรอบด้านครบ 5 มิติ ประเมินความคุ้มครองที่ลูกค้ามีและสิ่งที่ยังขาดอยู่ได้อย่างแม่นยำ",
  },
  {
    id: "broker-ai-insight",
    stepNumber: 4,
    title: "AI ช่วยจัดลำดับความสำคัญ",
    description: "AI ช่วยตอบคำถามว่า 'ทำไมควรติดต่อลูกค้ารายนี้ในเวลานี้ (Why Now)' พร้อมแจกแจงเหตุผลและปัจจัยสนับสนุนเป็นภาษาไทยอย่างโปร่งใส ไร้กล่องดำ ช่วยให้คุณมั่นใจและเข้าใจที่มาของคำแนะนำทุกครั้ง",
    route: "/customers/KS-00001",
    targetSelector: '[data-tour="ai-insight"], [data-tour="ai-priority-card"]',
    placement: "left",
    roles: ["broker"],
    tag: "วิเคราะห์เหตุผล Why Now",
    icon: "🧠",
    keyHighlight: "💡 แจกแจงปัจจัยสำคัญที่ทำให้ลูกค้าต้องการความคุ้มครองในตอนนี้ โปร่งใส ตรวจสอบได้ทุกข้อ",
  },
  {
    id: "broker-recommendations",
    stepNumber: 5,
    title: "คำแนะนำสำหรับลูกค้า",
    description: "ระบบช่วยตรวจสอบเงื่อนไขและคุณสมบัติของผลิตภัณฑ์ให้ตรงกับเกณฑ์ 100% ป้องกันข้อผิดพลาดในการนำเสนอ โดยคุณสามารถเลือกปรับเปลี่ยน ตอบรับ หรือปฏิเสธข้อเสนอได้ตามดุลยพินิจของคุณเสมอ",
    route: "/customers/KS-00001",
    targetSelector: '[data-tour="recommendation"], [data-tour="product-recommendations"]',
    placement: "top",
    roles: ["broker"],
    tag: "คัดกรองผลิตภัณฑ์ 100%",
    icon: "🛡️",
    keyHighlight: "🛡️ คัดกรองเกณฑ์คุณสมบัติตายตัว 100% ป้องกันการเสนอผิดเงื่อนไข พร้อมเปิดให้คุณพิจารณาตัดสินใจขั้นสุดท้าย",
  },
  {
    id: "broker-nearby",
    stepNumber: 6,
    title: "ลูกค้าใกล้เคียง",
    description: "ดูว่ามีลูกค้ารายใดอยู่ใกล้คุณบ้างในรัศมี 5, 10 หรือ 20 กิโลเมตร พร้อมแสดงระยะทางจริงและระดับความสำคัญ ช่วยให้คุณวางแผนแวะเยี่ยมลูกค้าในพื้นที่ใกล้เคียงได้อย่างคุ้มค่าเวลาในการเดินทาง",
    route: "/visit-planner",
    targetSelector: '[data-tour="nearby-customers"], [data-tour="nearby-customers-map"]',
    placement: "right",
    roles: ["broker"],
    tag: "แผนที่ลูกค้าใกล้เคียง",
    icon: "📍",
    keyHighlight: "📍 เรดาร์ระบุตำแหน่งลูกค้าตามพิกัดจริง ช่วยให้คุณจัดคิวแวะเยี่ยมลูกค้าในละแวกเดียวกันได้อย่างสะดวก",
  },
  {
    id: "broker-manual-selection",
    stepNumber: 7,
    title: "คุณเป็นคนเลือก",
    description: "ระบบให้เกียรติความเป็นมืออาชีพของคุณ 100% โดย AI ทำหน้าที่เป็นเพียงผู้ช่วยสรุปข้อมูลและนำเสนอทางเลือก แต่คุณเป็นผู้เลือกเองเสมอว่าจะเข้าพบลูกค้ารายใด และเวลาใดที่เหมาะสมที่สุด",
    route: "/visit-planner",
    targetSelector: '[data-tour="customer-selection"], [data-tour="customer-selection-action"]',
    placement: "left",
    roles: ["broker"],
    tag: "คุณเป็นผู้ตัดสินใจ",
    icon: "✋",
    keyHighlight: "✋ คุณคือผู้ตัดสินใจขั้นสุดท้ายเสมอ มีอิสระเต็มที่ในการเลือกดูแลลูกค้าตามดุลยพินิจของคุณ",
  },
  {
    id: "broker-navigation",
    stepNumber: 8,
    title: "นำทางเมื่อต้องการ",
    description: "เมื่อคุณเลือกลูกค้าที่จะไปพบเรียบร้อยแล้ว สามารถกดปุ่มเปิด Google Maps นำทางไปยังตำแหน่งลูกค้าได้ทันที สะดวก แม่นยำ และคำนวณเวลาเดินทางตามสภาพการจราจรจริงเมื่อคุณพร้อมออกเดินทาง",
    route: "/visit-planner",
    targetSelector: '[data-tour="navigation"], [data-tour="navigation-preview-action"]',
    placement: "top",
    roles: ["broker"],
    tag: "นำทางด้วย Google Maps",
    icon: "🧭",
    keyHighlight: "🧭 เปิด Google Maps นำทางไปยังพิกัดลูกค้าได้ทันทีในคลิกเดียว พร้อมอัปเดตสภาพจราจรแบบเรียลไทม์",
  },
  {
    id: "broker-analytics",
    stepNumber: 9,
    title: "Analytics",
    description: "ติดตามผลงานและความสำเร็จของคุณอย่างต่อเนื่อง ดูอัตราการตอบรับข้อเสนอ ช่องว่างความคุ้มครองที่ช่วยลูกค้าปิดได้สำเร็จ พร้อมส่งออกรายงานสรุปผลเป็นไฟล์ CSV ภาษาไทยไปใช้งานต่อได้ทันที",
    route: "/analytics",
    targetSelector: '[data-tour="analytics"], [data-tour="analytics-overview"]',
    placement: "bottom",
    roles: ["broker"],
    tag: "ภาพรวมผลงาน",
    icon: "📊",
    keyHighlight: "📊 ดูอัตราความสำเร็จในการดูแลลูกค้า และดาวน์โหลดรายงานสรุปผลการดำเนินงานภาษาไทยได้ตลอดเวลา",
  },
];

export const MANAGER_TOUR_STEPS: TourStep[] = [
  {
    id: "manager-dashboard",
    stepNumber: 1,
    title: "แดชบอร์ดภาพรวมการดำเนินงาน",
    description: "หน้าสรุปผลงานระดับบริหาร ติดตามประสิทธิภาพการทำงานของทีม สถิติดูแลลูกค้ากลุ่มเป้าหมาย และเป้าหมายประจำวันได้อย่างรวดเร็ว",
    route: "/dashboard",
    targetSelector: '[data-tour="dashboard-overview"]',
    placement: "bottom",
    roles: ["manager"],
    tag: "มุมมองผู้บริหาร",
    icon: "🏠",
    keyHighlight: "📊 ศูนย์รวมดัชนีชี้วัดความคืบหน้าของทีมงานทั้งหมดในหน้าเดียว",
  },
  {
    id: "manager-pipeline",
    stepNumber: 2,
    title: "ภาพรวมการวิเคราะห์ลูกค้า",
    description: "ตรวจสอบการกระจายตัวของลูกค้าในพอร์ตโฟลิโอ ติดตามสถานะความเร่งด่วน และการเข้าพบลูกค้าของทีมงานอย่างใกล้ชิด",
    route: "/customers",
    targetSelector: '[data-tour="customer-table"]',
    placement: "top",
    roles: ["manager"],
    tag: "วิเคราะห์พอร์ตโฟลิโอ",
    icon: "👥",
    keyHighlight: "🔍 ตรวจสอบสุขภาพพอร์ตโฟลิโอและสถานะการตรวจสอบความถูกต้องของข้อมูล",
  },
  {
    id: "manager-coverage-gap",
    stepNumber: 3,
    title: "การประเมินความเสี่ยงและช่องว่างความคุ้มครอง",
    description: "วิเคราะห์ช่องว่างความคุ้มครอง (Coverage Gap) ของลูกค้าภาพรวม เพื่อมองเห็นโอกาสทางการตลาดและการวางกลยุทธ์เชิงรุกของทีม",
    route: "/analytics",
    targetSelector: '[data-tour="analytics-overview"]',
    placement: "bottom",
    roles: ["manager"],
    tag: "วิเคราะห์ช่องว่างความคุ้มครอง",
    icon: "🛡️",
    keyHighlight: "🎯 ชี้เป้าลูกค้าที่ยังขาดความคุ้มครองหลักเพื่อช่วยทีมวางแผนเข้าถึงลูกค้า",
  },
  {
    id: "manager-ai-insights",
    stepNumber: 4,
    title: "ระบบ AI Insight & ติดตามประสิทธิภาพทีม",
    description: "ประเมินความแม่นยำของคำแนะนำ AI อัตราการตอบรับข้อเสนอ และแนวโน้มความพึงพอใจของลูกค้า เพื่อนำมาพัฒนาทักษะทีมงาน",
    route: "/analytics",
    targetSelector: '[data-tour="analytics-overview"]',
    placement: "top",
    roles: ["manager"],
    tag: "ประสิทธิภาพทีมและ AI",
    icon: "🧠",
    keyHighlight: "📈 วัดผลอัตราความสำเร็จและผลตอบรับต่อคำแนะนำจากระบบ AI",
  },
  {
    id: "manager-reports",
    stepNumber: 5,
    title: "การกำกับดูแลและรายงานเชิงลึก",
    description: "เข้าถึงรายงานเชิงลึกเพื่อการตัดสินใจเชิงกลยุทธ์ ตรวจสอบมาตรฐานการทำงานและความโปร่งใสในการให้คำปรึกษาของทีม",
    route: "/analytics",
    targetSelector: '[data-tour="analytics-overview"]',
    placement: "bottom",
    roles: ["manager"],
    tag: "รายงานและการกำกับดูแล",
    icon: "📑",
    keyHighlight: "⚖️ รักษามาตรฐานการให้คำปรึกษาที่โปร่งใส ตรวจสอบได้ตามข้อกำหนด",
  },
];

export const ADMIN_TOUR_STEPS: TourStep[] = [
  {
    id: "admin-dashboard",
    stepNumber: 1,
    title: "ศูนย์กลางการควบคุมระบบ",
    description: "ตรวจสอบความพร้อมของระบบ การทำงานของ AI Engine และความพร้อมใช้งานของบริการต่างๆ ได้ตลอด 24 ชั่วโมง",
    route: "/dashboard",
    targetSelector: '[data-tour="dashboard-overview"]',
    placement: "bottom",
    roles: ["admin"],
    tag: "สถานะระบบ",
    icon: "⚡",
    keyHighlight: "🖥️ ควบคุมและตรวจสอบความพร้อมใช้งานของระบบทั้งหมดได้อย่างสมบูรณ์",
  },
  {
    id: "admin-model-monitoring",
    stepNumber: 2,
    title: "การตรวจสอบความสมบูรณ์ของโมเดล AI",
    description: "ติดตามความแม่นยำและประสิทธิภาพของโมเดล AI ตรวจสอบการปรับเทียบความน่าจะเป็น และเฝ้าระวังการเปลี่ยนแปลงของการกระจายข้อมูล (Data Drift)",
    route: "/model",
    targetSelector: '[data-tour="model-metrics"]',
    placement: "bottom",
    roles: ["admin"],
    tag: "ความสมบูรณ์ของโมเดล",
    icon: "🔬",
    keyHighlight: "🎯 วัดผลความแม่นยำและเฝ้าระวังความเสถียรของโมเดลอย่างต่อเนื่อง",
  },
  {
    id: "admin-shap",
    stepNumber: 3,
    title: "ความโปร่งใสและคำอธิบายโมเดล",
    description: "ตรวจสอบที่มาของการทำนายผ่านระบบวิเคราะห์ปัจจัย (Feature Attribution) เพื่อให้มั่นใจในความโปร่งใส ปราศจากอคติ และสอดคล้องกับหลักจริยธรรม AI",
    route: "/model",
    targetSelector: '[data-tour="model-shap"]',
    placement: "top",
    roles: ["admin"],
    tag: "ความโปร่งใสและจริยธรรม AI",
    icon: "⚖️",
    keyHighlight: "🔍 อธิบายที่มาได้ทุกการประเมินผล โปร่งใส ไร้กล่องดำ",
  },
  {
    id: "admin-audit",
    stepNumber: 4,
    title: "บันทึกประวัติการตรวจสอบย้อนกลับ",
    description: "บันทึกประวัติการประมวลผลและการตัดสินใจอย่างครบถ้วน เพื่อรองรับการตรวจสอบย้อนกลับและปฏิบัติตามกฎหมายคุ้มครองข้อมูลอย่างเคร่งครัด",
    route: "/admin/audit",
    targetSelector: '[data-tour="audit-log-table"]',
    placement: "top",
    roles: ["admin"],
    tag: "ประวัติการตรวจสอบ",
    icon: "📜",
    keyHighlight: "🔒 บันทึกประวัติที่โปร่งใส ตรวจสอบย้อนหลังได้ทุกขั้นตอน",
  },
  {
    id: "admin-pilot",
    stepNumber: 5,
    title: "การทดสอบนำร่องและการจำลองสถานการณ์",
    description: "จำลองสถานการณ์ทดสอบเพื่อประเมินความพร้อมและเสถียรภาพของระบบก่อนการปรับใช้จริง เพื่อความมั่นใจสูงสุดในการให้บริการ",
    route: "/pilot",
    targetSelector: '[data-tour="pilot-sandbox"]',
    placement: "bottom",
    roles: ["admin"],
    tag: "สภาพแวดล้อมทดสอบ",
    icon: "🧪",
    keyHighlight: "🚦 เครื่องมือจำลองสถานการณ์เพื่อทดสอบความพร้อมก่อนใช้งานจริง",
  },
];

export const FEATURE_CATALOG_ITEMS: FeatureCatalogItem[] = [
  {
    id: "feat-dashboard",
    title: "1. แดชบอร์ด & คิวงานด่วน AI",
    subtitle: "เริ่มต้นวันทำงานอย่างมั่นใจด้วยศูนย์รวมลูกค้ารายสำคัญ งานติดตามประจำวัน และคำแนะนำเชิงกลยุทธ์จาก AI",
    icon: "🏠",
    route: "/dashboard",
    stepIndex: 0,
    tag: "เริ่มต้นวันทำงาน",
    highlights: [
      "สรุปรายชื่อลูกค้าที่ควรดูแลเร่งด่วนประจำวัน เพื่อให้คุณไม่พลาดทุกโอกาสสำคัญ",
      "ระบบเช็คลิสต์งานติดตาม (Follow-up Tasks) บันทึกผลได้ทันทีในหน้าเดียว",
      "รับข้อเสนอแนะเชิงกลยุทธ์จาก AI เพื่อช่วยวางแผนการทำงานตั้งแต่เช้า",
    ],
  },
  {
    id: "feat-customers",
    title: "2. ฐานข้อมูลลูกค้า & ค้นหาอัจฉริยะ",
    subtitle: "ค้นหาและจัดการรายชื่อลูกค้าอย่างเป็นระบบ คัดกรองตามระดับความสำคัญและสถานะความคุ้มครองได้ทันที",
    icon: "👥",
    route: "/customers",
    stepIndex: 1,
    tag: "ฐานข้อมูลลูกค้า",
    highlights: [
      "พิมพ์ค้นหาด้วยชื่อ นามสกุล หรือรหัสลูกค้า ได้อย่างสะดวกรวดเร็ว",
      "แยกหมวดหมู่ลูกค้าตามระดับความเร่งด่วน ช่วยให้จัดลำดับการทำงานได้ง่ายขึ้น",
      "คลิกเปิดดูโปรไฟล์และประวัติการดูแลของลูกค้าแต่ละรายได้ทันที",
    ],
  },
  {
    id: "feat-customer-360",
    title: "3. ข้อมูลลูกค้า 360° & Gap ความคุ้มครอง",
    subtitle: "เข้าใจลูกค้าคนสำคัญลึกซึ้งรอบด้าน ทั้งประวัติกรมธรรม์เดิม สินทรัพย์ และวงล้อประเมินความคุ้มครอง 5 มิติ",
    icon: "👤",
    route: "/customers/KS-00001",
    stepIndex: 2,
    tag: "ภาพรวมลูกค้า 360°",
    highlights: [
      "วงล้อประเมินความคุ้มครองครบ 5 มิติ (ชีวิต, สุขภาพ, อุบัติเหตุ, โรคร้ายแรง, เกษียณ)",
      "รวมประวัติกรมธรรม์เดิม เบี้ยประกัน และความคุ้มครองที่ลูกค้ามีอยู่แล้วครบถ้วน",
      "ชี้เป้าช่องว่างความคุ้มครอง (Coverage Gap) ที่ลูกค้ายังขาดอยู่ เพื่อเตรียมบทสนทนาได้อย่างตรงจุด",
    ],
  },
  {
    id: "feat-ai-insight",
    title: "4. AI Why Now & ปัจจัยวิเคราะห์ที่โปร่งใส",
    subtitle: "เข้าใจชัดเจนว่า 'ทำไมควรติดต่อลูกค้ารายนี้ตอนนี้' พร้อมแจกแจงเหตุผลเป็นภาษาไทยอย่างโปร่งใส ไร้กล่องดำ",
    icon: "🧠",
    route: "/customers/KS-00001",
    stepIndex: 3,
    tag: "วิเคราะห์เหตุผล Why Now",
    highlights: [
      "อธิบายที่มาของคะแนนความเร่งด่วนอย่างละเอียด ด้วยภาษาไทยที่อ่านเข้าใจง่าย",
      "แจกแจงเหตุผลและปัจจัยสนับสนุนด้วยโมเดลวิเคราะห์ที่เปิดเผยและตรวจสอบได้",
      "ช่วยให้คุณเข้าใจบริบทของลูกค้าก่อนโทรหา เพิ่มความมั่นใจในการให้คำปรึกษา",
    ],
  },
  {
    id: "feat-recommendations",
    title: "5. คำแนะนำผลิตภัณฑ์คัดกรอง 100%",
    subtitle: "คัดสรรแผนประกันที่เหมาะสมและตรงคุณสมบัติของลูกค้าล่วงหน้า ป้องกันการเสนอผิดเงื่อนไข 100%",
    icon: "🛡️",
    route: "/customers/KS-00001",
    stepIndex: 4,
    tag: "คัดกรองคุณสมบัติ 100%",
    highlights: [
      "ระบบช่วยตรวจสอบอายุ อาชีพ และเกณฑ์คุณสมบัติตายตัว 100% ก่อนนำเสนอ",
      "จับคู่ผลิตภัณฑ์ที่ช่วยเติมเต็มช่องว่างความคุ้มครองของลูกค้าได้อย่างตรงเป้าหมาย",
      "คุณเป็นผู้พิจารณาเลือกข้อเสนอที่ดีที่สุด ตอบรับหรือปฏิเสธได้ด้วยตนเองเสมอ",
    ],
  },
  {
    id: "feat-nearby",
    title: "6. แผนที่ลูกค้าใกล้เคียงตามพิกัดจริง",
    subtitle: "ค้นหาลูกค้าที่อยู่ในละแวกใกล้เคียงรัศมี 5, 10, 20 กม. ช่วยวางแผนการเดินทางอย่างคุ้มค่าเวลา",
    icon: "📍",
    route: "/visit-planner",
    stepIndex: 5,
    tag: "แผนที่ลูกค้าใกล้เคียง",
    highlights: [
      "แผนที่เรดาร์แสดงตำแหน่งลูกค้าและระยะทางจริงจากจุดที่คุณอยู่",
      "ปรับเลือกรัศมี 5, 10 หรือ 20 กิโลเมตร ได้ตามความสะดวกในการเดินทาง",
      "แสดงระดับความสำคัญของลูกค้าบนแผนที่ ช่วยให้เห็นภาพรวมและจัดแผนเยี่ยมชมได้ทันที",
    ],
  },
  {
    id: "feat-selection",
    title: "7. คุณเป็นผู้เลือกเอง (อิสระในการตัดสินใจ)",
    subtitle: "ระบบให้เกียรติความเป็นมืออาชีพของคุณเสมอ AI เป็นเพียงผู้ช่วยเตรียมข้อมูล แต่คุณเป็นผู้ตัดสินใจเลือกเอง 100%",
    icon: "✋",
    route: "/visit-planner",
    stepIndex: 6,
    tag: "คุณเป็นผู้ตัดสินใจ",
    highlights: [
      "คุณเป็นผู้เลือกเองอย่างอิสระว่าจะเข้าพบลูกค้ารายใด และเวลาใดที่เหมาะสมที่สุด",
      "ไม่มีการบังคับหรือจัดคิวงานอัตโนมัติ คุณมีอำนาจบริหารจัดการเวลาของตนเองเต็มที่",
      "เสริมพลังการทำงานของคุณด้วยข้อมูลรอบด้าน ให้คุณเป็นที่ปรึกษาที่ลูกค้าไว้วางใจ",
    ],
  },
  {
    id: "feat-navigation",
    title: "8. ระบบนำทางจริง Google Maps เมื่อต้องการ",
    subtitle: "กดปุ่มเดียวเพื่อเปิด Google Maps นำทางไปยังตำแหน่งลูกค้าได้ทันทีเมื่อคุณพร้อมออกเดินทาง",
    icon: "🧭",
    route: "/visit-planner",
    stepIndex: 7,
    tag: "นำทาง Google Maps",
    highlights: [
      "เปิด Google Maps นำทางจริงแบบจุดต่อจุดได้ในคลิกเดียว ไม่ต้องพิมพ์ที่อยู่ซ้ำ",
      "คำนวณเวลาเดินทางและเส้นทางที่ดีที่สุดตามสภาพการจราจรแบบเรียลไทม์",
      "ใช้งานสะดวกบนสมาร์ตโฟนและแท็บเล็ต พร้อมออกเดินทางได้ทุกเมื่อ",
    ],
  },
  {
    id: "feat-analytics",
    title: "9. ศูนย์วิเคราะห์ผลงานและสถิติธุรกิจ",
    subtitle: "ติดตามความสำเร็จในการดูแลลูกค้า วิเคราะห์อัตราการตอบรับข้อเสนอ และส่งออกรายงานภาษาไทยได้ทันที",
    icon: "📊",
    route: "/analytics",
    stepIndex: 8,
    tag: "วิเคราะห์ผลงาน",
    highlights: [
      "ติดตามสถิติและอัตราการตอบรับข้อเสนอ เพื่อประเมินและพัฒนาแนวทางการดูแลลูกค้า",
      "ดูภาพรวมการช่วยลูกค้าปิดช่องว่างความคุ้มครองในพอร์ตโฟลิโอของคุณ",
      "ดาวน์โหลดรายงานสรุปผลงานเป็นไฟล์ CSV ภาษาไทย เพื่อนำไปใช้งานต่อได้สะดวกรวดเร็ว",
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
