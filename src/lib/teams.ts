import type { Locale } from "@/lib/i18n";

export type Category = "technical" | "non_technical";

type Bi = { ar: string; en: string };
type BiList = { ar: string[]; en: string[] };

export interface Team {
  id: string;
  category: Category;
  acronym?: string;
  name: Bi;
  description: Bi;
  responsibilities: BiList;
  activities: BiList;
  /** Skill ids from SKILLS that are most relevant to this team. */
  skills: string[];
}

export const TEAMS: Team[] = [
  // ───────────── Technical ─────────────
  {
    id: "structures",
    category: "technical",
    acronym: "S&D",
    name: { en: "Structures & Deployables", ar: "هياكل القمر الصناعي والأنظمة الميكانيكية" },
    description: {
      en: "Designs the mechanical structure, satellite enclosure, mounting systems, and deployment mechanisms.",
      ar: "يصمم الهيكل الميكانيكي للقمر الصناعي وغلافه وأنظمة التثبيت وآليات النشر.",
    },
    responsibilities: {
      en: ["Primary structure and enclosure design", "Component mounting and integration layout", "Deployment mechanisms for antennas and panels"],
      ar: ["تصميم الهيكل الرئيسي والغلاف", "تخطيط تثبيت المكونات ودمجها", "آليات نشر الهوائيات والألواح"],
    },
    activities: {
      en: ["Building CAD assemblies", "3D-printing test prototypes", "Fit-checks with other subsystems"],
      ar: ["بناء النماذج المجمّعة باستخدام CAD", "طباعة نماذج اختبارية ثلاثية الأبعاد", "اختبارات التوافق مع الأنظمة الأخرى"],
    },
    skills: ["cad", "solidworks", "fusion360", "autocad", "mech_design", "printing3d"],
  },
  {
    id: "eps",
    category: "technical",
    acronym: "EPS",
    name: { en: "Electrical Power System", ar: "نظام الطاقة الكهربائية" },
    description: {
      en: "Develops the satellite's electrical power generation, storage, regulation, and distribution.",
      ar: "يطوّر منظومة توليد الطاقة الكهربائية للقمر الصناعي وتخزينها وتنظيمها وتوزيعها.",
    },
    responsibilities: {
      en: ["Solar power generation and battery storage", "Voltage regulation and power distribution", "Power budget analysis"],
      ar: ["توليد الطاقة الشمسية وتخزينها في البطاريات", "تنظيم الجهد وتوزيع الطاقة", "تحليل ميزانية الطاقة"],
    },
    activities: {
      en: ["Designing regulator circuits", "Testing battery charge cycles", "Laying out power PCBs"],
      ar: ["تصميم دوائر التنظيم", "اختبار دورات شحن البطاريات", "تصميم لوحات الطاقة المطبوعة"],
    },
    skills: ["electronics", "circuit_design", "pcb", "batteries", "solar", "matlab"],
  },
  {
    id: "obc",
    category: "technical",
    acronym: "OBC",
    name: { en: "On-Board Computer", ar: "الحاسوب المركزي للقمر الصناعي" },
    description: {
      en: "Develops the onboard computer architecture and subsystem interfaces.",
      ar: "يطوّر بنية الحاسوب المركزي على متن القمر الصناعي وواجهات الربط مع الأنظمة الفرعية.",
    },
    responsibilities: {
      en: ["Onboard computer architecture", "Interfaces between subsystems (I²C, SPI, UART)", "Data storage and timing"],
      ar: ["تصميم بنية الحاسوب المركزي", "واجهات الاتصال التسلسلي بين الأنظمة الفرعية", "تخزين البيانات والتوقيت"],
    },
    activities: {
      en: ["Selecting and evaluating microcontrollers", "Prototyping on development boards", "Defining interface specifications"],
      ar: ["اختيار المتحكمات الدقيقة وتقييمها", "بناء نماذج أولية على لوحات التطوير", "تحديد مواصفات الواجهات"],
    },
    skills: ["microcontrollers", "embedded", "arduino", "c_cpp", "digital_electronics", "pcb"],
  },
  {
    id: "software",
    category: "technical",
    name: { en: "Software Team", ar: "فريق البرمجيات" },
    description: {
      en: "Develops embedded software, command processing, data handling, and simulation tools.",
      ar: "يطوّر البرمجيات المدمجة ومعالجة الأوامر وإدارة البيانات وأدوات المحاكاة.",
    },
    responsibilities: {
      en: ["Flight software and command handling", "Telemetry and data handling", "Simulation and test tools"],
      ar: ["برمجيات الطيران ومعالجة الأوامر", "القياسات عن بُعد وإدارة البيانات", "أدوات المحاكاة والاختبار"],
    },
    activities: {
      en: ["Writing embedded C/C++ modules", "Building Python ground tools", "Code reviews with Git"],
      ar: ["كتابة وحدات برمجية مدمجة بلغة C/C++", "بناء أدوات أرضية بلغة Python", "مراجعة الشيفرات باستخدام Git"],
    },
    skills: ["python", "c_cpp", "embedded", "git", "linux", "arduino"],
  },
  {
    id: "comms",
    category: "technical",
    acronym: "COMMS",
    name: { en: "Communications Team", ar: "فريق الاتصالات" },
    description: {
      en: "Develops the communication architecture between the satellite and ground station.",
      ar: "يطوّر منظومة الاتصال بين القمر الصناعي والمحطة الأرضية.",
    },
    responsibilities: {
      en: ["Radio link design and link budget", "Antenna selection and testing", "Ground station setup"],
      ar: ["تصميم الوصلة الراديوية وحساب ميزانيتها", "اختيار الهوائيات واختبارها", "تجهيز المحطة الأرضية"],
    },
    activities: {
      en: ["Calculating link budgets", "Testing radio modules", "Decoding received signals"],
      ar: ["حساب ميزانية الوصلة", "اختبار وحدات الراديو", "فك تشفير الإشارات المستقبلة"],
    },
    skills: ["rf", "antennas", "signal_processing", "networking", "matlab", "python"],
  },
  {
    id: "payload",
    category: "technical",
    name: { en: "Imaging & Payload Team", ar: "فريق التصوير والحمولة العلمية" },
    description: {
      en: "Develops scientific payloads, sensors, imaging systems, and data acquisition applications.",
      ar: "يطوّر الحمولات العلمية والمستشعرات وأنظمة التصوير وتطبيقات جمع البيانات.",
    },
    responsibilities: {
      en: ["Payload and mission objectives", "Camera and sensor integration", "Image and data processing"],
      ar: ["تحديد الحمولة وأهداف المهمة", "دمج الكاميرات والمستشعرات", "معالجة الصور والبيانات"],
    },
    activities: {
      en: ["Evaluating camera modules", "Writing image-processing scripts", "Planning data acquisition"],
      ar: ["تقييم وحدات الكاميرا", "كتابة برامج لمعالجة الصور", "تخطيط عمليات جمع البيانات"],
    },
    skills: ["sensors", "image_processing", "python", "electronics", "matlab"],
  },
  {
    id: "thermal",
    category: "technical",
    name: { en: "Thermal Team", ar: "فريق الأنظمة الحرارية" },
    description: {
      en: "Studies thermal conditions and develops solutions for thermal management.",
      ar: "يدرس الظروف الحرارية ويطوّر حلول الإدارة الحرارية.",
    },
    responsibilities: {
      en: ["Thermal environment analysis", "Thermal control design", "Thermal test planning"],
      ar: ["تحليل البيئة الحرارية", "تصميم أنظمة التحكم الحراري", "تخطيط الاختبارات الحرارية"],
    },
    activities: {
      en: ["Running thermal simulations", "Selecting coatings and materials", "Analysing temperature data"],
      ar: ["إجراء المحاكاة الحرارية", "اختيار الطلاءات والمواد", "تحليل بيانات درجات الحرارة"],
    },
    skills: ["thermodynamics", "simulation", "matlab", "cad", "solidworks"],
  },
  {
    id: "adcs",
    category: "technical",
    acronym: "ADCS",
    name: { en: "Attitude Determination & Control", ar: "فريق تحديد الاتجاه والتحكم" },
    description: {
      en: "Develops systems that determine and control satellite orientation.",
      ar: "يطوّر الأنظمة التي تحدد اتجاه القمر الصناعي وتتحكم فيه.",
    },
    responsibilities: {
      en: ["Orientation sensing (magnetometers, sun sensors, IMUs)", "Control algorithms and actuators", "Dynamics modelling"],
      ar: ["استشعار الاتجاه (مقاييس المغناطيسية ومستشعرات الشمس ووحدات القياس بالقصور الذاتي)", "خوارزميات التحكم والمشغّلات", "نمذجة الديناميكا"],
    },
    activities: {
      en: ["Modelling in MATLAB/Simulink", "Testing sensors on a bench setup", "Tuning control loops"],
      ar: ["النمذجة باستخدام MATLAB وSimulink", "اختبار المستشعرات على منصة تجريبية", "ضبط حلقات التحكم"],
    },
    skills: ["control_systems", "matlab", "simulink", "sensors", "python", "c_cpp"],
  },

  // ───────────── Non-technical ─────────────
  {
    id: "graphic_design",
    category: "non_technical",
    name: { en: "Graphic Design", ar: "التصميم الجرافيكي" },
    description: {
      en: "Designs visual identity, posters, presentations, and promotional materials.",
      ar: "يصمم الهوية البصرية والملصقات والعروض التقديمية والمواد الترويجية.",
    },
    responsibilities: {
      en: ["Maintaining the project's visual identity", "Posters, banners, and presentations", "Design support for other teams"],
      ar: ["الحفاظ على الهوية البصرية للمشروع", "تصميم الملصقات واللافتات والعروض", "دعم الفرق الأخرى في التصميم"],
    },
    activities: {
      en: ["Designing event posters", "Preparing presentation templates", "Creating diagrams and infographics"],
      ar: ["تصميم ملصقات الفعاليات", "إعداد قوالب العروض التقديمية", "إنشاء الرسوم التوضيحية والإنفوجرافيك"],
    },
    skills: ["graphic_design", "canva", "illustrator", "photoshop", "figma"],
  },
  {
    id: "social_media",
    category: "non_technical",
    name: { en: "Social Media", ar: "الإعلام الرقمي" },
    description: {
      en: "Creates content, documents project activities, and manages digital communication.",
      ar: "يُعدّ المحتوى ويوثّق أنشطة المشروع ويدير التواصل الرقمي.",
    },
    responsibilities: {
      en: ["Planning and publishing content", "Documenting milestones with photo and video", "Managing digital channels"],
      ar: ["تخطيط المحتوى ونشره", "توثيق المراحل بالصور والفيديو", "إدارة القنوات الرقمية"],
    },
    activities: {
      en: ["Filming lab sessions", "Writing bilingual posts", "Preparing a content calendar"],
      ar: ["تصوير جلسات العمل في المختبر", "كتابة منشورات ثنائية اللغة", "إعداد جدول المحتوى"],
    },
    skills: ["content_writing", "video_editing", "canva", "photoshop", "public_speaking"],
  },
  {
    id: "website",
    category: "non_technical",
    name: { en: "Website Development", ar: "تطوير الموقع الإلكتروني" },
    description: {
      en: "Develops and maintains the project website and digital communication pages.",
      ar: "يطوّر الموقع الإلكتروني للمشروع وصفحات التواصل الرقمي ويحافظ عليها.",
    },
    responsibilities: {
      en: ["Building and maintaining the website", "Publishing project updates", "Accessibility and bilingual content"],
      ar: ["بناء الموقع الإلكتروني وصيانته", "نشر تحديثات المشروع", "إتاحة الوصول والمحتوى ثنائي اللغة"],
    },
    activities: {
      en: ["Building pages", "Updating team profiles", "Improving performance"],
      ar: ["بناء الصفحات", "تحديث ملفات الفرق", "تحسين الأداء"],
    },
    skills: ["web_development", "figma", "git", "content_writing"],
  },
  {
    id: "outreach",
    category: "non_technical",
    name: { en: "Outreach & Partnerships", ar: "العلاقات والشراكات" },
    description: {
      en: "Coordinates communication with institutions, companies, universities, and potential partners.",
      ar: "ينسّق التواصل مع المؤسسات والشركات والجامعات والشركاء المحتملين.",
    },
    responsibilities: {
      en: ["Building relationships with partners", "Preparing formal correspondence", "Coordinating visits and meetings"],
      ar: ["بناء العلاقات مع الشركاء", "إعداد المراسلات الرسمية", "تنسيق الزيارات والاجتماعات"],
    },
    activities: {
      en: ["Drafting partnership letters", "Presenting the project to visitors", "Maintaining a contacts list"],
      ar: ["صياغة خطابات الشراكة", "عرض المشروع على الزوار", "إدارة قائمة جهات الاتصال"],
    },
    skills: ["public_speaking", "content_writing", "event_management", "sponsorship"],
  },
  {
    id: "funding",
    category: "non_technical",
    name: { en: "Grants & Funding", ar: "التمويل والرعاية" },
    description: {
      en: "Identifies funding opportunities, supports sponsorship proposals, and prepares funding documentation.",
      ar: "يحدد فرص التمويل ويدعم مقترحات الرعاية ويُعدّ وثائق التمويل.",
    },
    responsibilities: {
      en: ["Researching grants and sponsors", "Preparing sponsorship packages", "Tracking budgets and reports"],
      ar: ["البحث عن المنح والرعاة", "إعداد حزم الرعاية", "متابعة الميزانيات والتقارير"],
    },
    activities: {
      en: ["Writing proposals", "Preparing budget summaries", "Following up with sponsors"],
      ar: ["كتابة المقترحات", "إعداد ملخصات الميزانية", "المتابعة مع الرعاة"],
    },
    skills: ["sponsorship", "content_writing", "public_speaking", "canva"],
  },
  {
    id: "merchandise",
    category: "non_technical",
    name: { en: "Merchandise & Branding", ar: "الهوية والمنتجات الترويجية" },
    description: {
      en: "Develops branded materials and promotional products for the project.",
      ar: "يطوّر المواد التي تحمل هوية المشروع والمنتجات الترويجية.",
    },
    responsibilities: {
      en: ["Branded products and mission patches", "Working with suppliers", "Brand consistency"],
      ar: ["المنتجات التي تحمل الهوية وشعارات المهمة", "التعامل مع المورّدين", "اتساق الهوية"],
    },
    activities: {
      en: ["Designing patches and stickers", "Comparing supplier quotes", "Managing stock for events"],
      ar: ["تصميم الشعارات والملصقات", "مقارنة عروض المورّدين", "إدارة المخزون للفعاليات"],
    },
    skills: ["graphic_design", "illustrator", "canva", "event_management"],
  },
  {
    id: "events",
    category: "non_technical",
    name: { en: "Competitions & Events", ar: "المسابقات والفعاليات" },
    description: {
      en: "Identifies relevant competitions and coordinates student participation, workshops, and events.",
      ar: "يحدد المسابقات ذات الصلة وينسّق مشاركة الطلبة والورش والفعاليات.",
    },
    responsibilities: {
      en: ["Tracking competitions and deadlines", "Organising workshops and talks", "Event logistics"],
      ar: ["متابعة المسابقات ومواعيدها", "تنظيم الورش والمحاضرات", "الترتيبات اللوجستية للفعاليات"],
    },
    activities: {
      en: ["Preparing competition entries", "Running a workshop day", "Coordinating volunteers"],
      ar: ["إعداد ملفات المشاركة في المسابقات", "تنظيم يوم للورش", "تنسيق المتطوعين"],
    },
    skills: ["event_management", "public_speaking", "content_writing", "canva"],
  },
];

export const teamById = (id: string | null | undefined) => TEAMS.find((t) => t.id === id);
export const teamsFor = (category: Category) => TEAMS.filter((t) => t.category === category);
/** English label shown beside the team name: the acronym (e.g. EPS) or, if none, the English name. */
export const teamTag = (team: Team, locale: Locale) => (locale === "ar" ? team.acronym ?? team.name.en : team.acronym);

/** Team name as plain text, with its English tag in brackets, e.g. "نظام الطاقة الكهربائية (EPS)". */
export const teamName = (id: string | null | undefined, locale: Locale) => {
  const t = teamById(id);
  if (!t) return id ?? "";
  const tag = teamTag(t, locale);
  return tag ? `${t.name[locale]} (${tag})` : t.name[locale];
};

export interface Skill {
  id: string;
  category: Category;
  label: Bi;
}

// Software and programming languages keep their English names in both languages.
const s = (id: string, category: Category, en: string, ar = en): Skill => ({ id, category, label: { en, ar } });

export const SKILLS: Skill[] = [
  s("python", "technical", "Python"),
  s("c_cpp", "technical", "C/C++"),
  s("arduino", "technical", "Arduino"),
  s("matlab", "technical", "MATLAB"),
  s("simulink", "technical", "Simulink"),
  s("solidworks", "technical", "SolidWorks"),
  s("fusion360", "technical", "Fusion 360"),
  s("autocad", "technical", "AutoCAD"),
  s("cad", "technical", "CAD"),
  s("pcb", "technical", "PCB Design", "تصميم PCB"),
  s("electronics", "technical", "Electronics", "الإلكترونيات"),
  s("circuit_design", "technical", "Circuit design", "تصميم الدوائر"),
  s("batteries", "technical", "Batteries & storage", "البطاريات والتخزين"),
  s("solar", "technical", "Solar power", "الطاقة الشمسية"),
  s("microcontrollers", "technical", "Microcontrollers", "المتحكمات الدقيقة"),
  s("embedded", "technical", "Embedded systems", "الأنظمة المدمجة"),
  s("digital_electronics", "technical", "Digital electronics", "الإلكترونيات الرقمية"),
  s("networking", "technical", "Networking", "الشبكات"),
  s("linux", "technical", "Linux"),
  s("git", "technical", "Git"),
  s("printing3d", "technical", "3D Printing", "الطباعة ثلاثية الأبعاد"),
  s("mech_design", "technical", "Mechanical design", "التصميم الميكانيكي"),
  s("rf", "technical", "RF systems", "أنظمة الترددات الراديوية"),
  s("antennas", "technical", "Antennas", "الهوائيات"),
  s("signal_processing", "technical", "Signal processing", "معالجة الإشارات"),
  s("sensors", "technical", "Sensors", "المستشعرات"),
  s("image_processing", "technical", "Image processing", "معالجة الصور"),
  s("thermodynamics", "technical", "Thermodynamics & heat transfer", "الديناميكا الحرارية وانتقال الحرارة"),
  s("simulation", "technical", "Simulation & analysis", "المحاكاة والتحليل"),
  s("control_systems", "technical", "Control systems", "أنظمة التحكم"),

  s("graphic_design", "non_technical", "Graphic design", "التصميم الجرافيكي"),
  s("canva", "non_technical", "Canva"),
  s("illustrator", "non_technical", "Adobe Illustrator"),
  s("photoshop", "non_technical", "Photoshop"),
  s("figma", "non_technical", "Figma"),
  s("video_editing", "non_technical", "Video editing", "تحرير الفيديو"),
  s("public_speaking", "non_technical", "Public speaking", "الإلقاء والتحدث أمام الجمهور"),
  s("content_writing", "non_technical", "Content writing", "كتابة المحتوى"),
  s("event_management", "non_technical", "Event management", "إدارة الفعاليات"),
  s("sponsorship", "non_technical", "Sponsorship proposals", "مقترحات الرعاية"),
  s("web_development", "non_technical", "Web development", "تطوير المواقع"),
];

export const skillById = (id: string) => SKILLS.find((k) => k.id === id);
export const SKILL_IDS = SKILLS.map((k) => k.id);
export const TEAM_IDS = TEAMS.map((t) => t.id);
