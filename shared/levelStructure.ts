// HSK-based Level Structure for FlowLingo
// Each HSK level contains 10 practice levels with unique topics

export interface LevelInfo {
  level: number;
  hskLevel: number;
  topic: string;
  topicEmoji: string;
  description: string;
  vocabularyFocus: string[];
  grammarFocus: string[];
  estimatedWords: number;
}

export const levelStructure: LevelInfo[] = [
  // HSK 1 (Levels 1-10) - 150 words total
  {
    level: 1,
    hskLevel: 1,
    topic: "Greetings & Names",
    topicEmoji: "👋",
    description: "Basic greetings, introductions, and asking names",
    vocabularyFocus: ["你好", "谢谢", "再见", "我", "你", "他", "她", "叫", "什么", "名字"],
    grammarFocus: ["Subject + 是 + Object", "你叫什么名字？"],
    estimatedWords: 15
  },
  {
    level: 2,
    hskLevel: 1,
    topic: "Numbers & Age",
    topicEmoji: "🔢",
    description: "Numbers 1-10, asking and telling age",
    vocabularyFocus: ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "岁", "多大"],
    grammarFocus: ["你多大？", "我...岁"],
    estimatedWords: 15
  },
  {
    level: 3,
    hskLevel: 1,
    topic: "Family Members",
    topicEmoji: "👨‍👩‍👧‍👦",
    description: "Family relationships and describing family",
    vocabularyFocus: ["爸爸", "妈妈", "哥哥", "姐姐", "弟弟", "妹妹", "儿子", "女儿", "家", "有"],
    grammarFocus: ["我有...", "这是我的..."],
    estimatedWords: 15
  },
  {
    level: 4,
    hskLevel: 1,
    topic: "Days & Dates",
    topicEmoji: "📅",
    description: "Days of the week, months, and dates",
    vocabularyFocus: ["今天", "明天", "昨天", "星期", "月", "号", "年", "现在", "时候"],
    grammarFocus: ["今天是星期几？", "几月几号？"],
    estimatedWords: 15
  },
  {
    level: 5,
    hskLevel: 1,
    topic: "Food & Drinks",
    topicEmoji: "🍜",
    description: "Common foods, drinks, and ordering",
    vocabularyFocus: ["吃", "喝", "米饭", "面条", "水", "茶", "咖啡", "菜", "水果", "喜欢"],
    grammarFocus: ["我喜欢吃...", "你想喝什么？"],
    estimatedWords: 15
  },
  {
    level: 6,
    hskLevel: 1,
    topic: "Shopping & Money",
    topicEmoji: "🛍️",
    description: "Basic shopping, prices, and money",
    vocabularyFocus: ["买", "卖", "钱", "多少", "块", "元", "便宜", "贵", "东西", "商店"],
    grammarFocus: ["多少钱？", "太贵了"],
    estimatedWords: 15
  },
  {
    level: 7,
    hskLevel: 1,
    topic: "Places & Directions",
    topicEmoji: "🗺️",
    description: "Common places and basic directions",
    vocabularyFocus: ["这里", "那里", "哪里", "学校", "家", "医院", "商店", "去", "来", "在"],
    grammarFocus: ["在哪里？", "我去..."],
    estimatedWords: 15
  },
  {
    level: 8,
    hskLevel: 1,
    topic: "Time & Daily Activities",
    topicEmoji: "⏰",
    description: "Telling time and daily routines",
    vocabularyFocus: ["点", "分", "小时", "早上", "中午", "晚上", "睡觉", "起床", "工作", "休息"],
    grammarFocus: ["几点了？", "我...点起床"],
    estimatedWords: 15
  },
  {
    level: 9,
    hskLevel: 1,
    topic: "Weather & Seasons",
    topicEmoji: "☀️",
    description: "Weather conditions and seasons",
    vocabularyFocus: ["天气", "热", "冷", "下雨", "下雪", "春天", "夏天", "秋天", "冬天", "很"],
    grammarFocus: ["今天天气怎么样？", "很热/冷"],
    estimatedWords: 15
  },
  {
    level: 10,
    hskLevel: 1,
    topic: "Basic Emotions",
    topicEmoji: "😊",
    description: "Expressing feelings and emotions",
    vocabularyFocus: ["高兴", "开心", "难过", "生气", "累", "饿", "渴", "怎么样", "觉得", "很"],
    grammarFocus: ["你怎么样？", "我很..."],
    estimatedWords: 15
  },

  // HSK 2 (Levels 11-20) - 300 words total
  {
    level: 11,
    hskLevel: 2,
    topic: "Transportation",
    topicEmoji: "🚗",
    description: "Modes of transport and travel",
    vocabularyFocus: ["汽车", "火车", "飞机", "地铁", "公交车", "自行车", "走", "开", "坐", "快", "慢"],
    grammarFocus: ["坐...去", "从...到..."],
    estimatedWords: 30
  },
  {
    level: 12,
    hskLevel: 2,
    topic: "Health & Body",
    topicEmoji: "🏥",
    description: "Body parts, health, and illness",
    vocabularyFocus: ["身体", "头", "眼睛", "耳朵", "手", "脚", "病", "药", "医生", "疼", "舒服"],
    grammarFocus: ["...疼", "吃药"],
    estimatedWords: 30
  },
  {
    level: 13,
    hskLevel: 2,
    topic: "Hobbies & Sports",
    topicEmoji: "⚽",
    description: "Sports, hobbies, and leisure activities",
    vocabularyFocus: ["运动", "足球", "篮球", "游泳", "跑步", "唱歌", "跳舞", "看书", "电影", "音乐"],
    grammarFocus: ["喜欢...ing", "会..."],
    estimatedWords: 30
  },
  {
    level: 14,
    hskLevel: 2,
    topic: "School & Study",
    topicEmoji: "📚",
    description: "School subjects and studying",
    vocabularyFocus: ["上课", "下课", "考试", "作业", "老师", "学生", "数学", "英语", "中文", "难", "容易"],
    grammarFocus: ["在...ing", "...得怎么样？"],
    estimatedWords: 30
  },
  {
    level: 15,
    hskLevel: 2,
    topic: "Work & Office",
    topicEmoji: "💼",
    description: "Work, jobs, and office life",
    vocabularyFocus: ["工作", "公司", "办公室", "老板", "同事", "会议", "忙", "加班", "休息", "工资"],
    grammarFocus: ["在...工作", "...得很晚"],
    estimatedWords: 30
  },
  {
    level: 16,
    hskLevel: 2,
    topic: "Colors & Clothing",
    topicEmoji: "👕",
    description: "Colors, clothes, and appearance",
    vocabularyFocus: ["红色", "蓝色", "白色", "黑色", "衣服", "裤子", "鞋子", "穿", "漂亮", "新", "旧"],
    grammarFocus: ["穿着...", "...的"],
    estimatedWords: 30
  },
  {
    level: 17,
    hskLevel: 2,
    topic: "Housing & Rooms",
    topicEmoji: "🏠",
    description: "Rooms, furniture, and home life",
    vocabularyFocus: ["房间", "客厅", "卧室", "厨房", "洗手间", "桌子", "椅子", "床", "门", "窗户"],
    grammarFocus: ["在...里", "...旁边"],
    estimatedWords: 30
  },
  {
    level: 18,
    hskLevel: 2,
    topic: "Technology & Phones",
    topicEmoji: "📱",
    description: "Technology, phones, and internet",
    vocabularyFocus: ["电话", "手机", "电脑", "网络", "发", "打电话", "短信", "邮件", "上网", "游戏"],
    grammarFocus: ["给...打电话", "发...给..."],
    estimatedWords: 30
  },
  {
    level: 19,
    hskLevel: 2,
    topic: "Restaurants & Service",
    topicEmoji: "🍽️",
    description: "Dining out and service",
    vocabularyFocus: ["餐厅", "服务员", "菜单", "点菜", "好吃", "味道", "甜", "辣", "咸", "账单"],
    grammarFocus: ["请给我...", "...怎么样？"],
    estimatedWords: 30
  },
  {
    level: 20,
    hskLevel: 2,
    topic: "Travel & Hotels",
    topicEmoji: "✈️",
    description: "Travel, hotels, and tourism",
    vocabularyFocus: ["旅游", "酒店", "房间", "预订", "护照", "行李", "机场", "火车站", "景点", "拍照"],
    grammarFocus: ["去...旅游", "住在..."],
    estimatedWords: 30
  },

  // HSK 3 (Levels 21-30) - 600 words total
  {
    level: 21,
    hskLevel: 3,
    topic: "Environment & Nature",
    topicEmoji: "🌳",
    description: "Environment, nature, and ecology",
    vocabularyFocus: ["环境", "空气", "污染", "干净", "树", "花", "草", "河", "山", "保护"],
    grammarFocus: ["把...verb", "被..."],
    estimatedWords: 60
  },
  {
    level: 22,
    hskLevel: 3,
    topic: "Culture & Traditions",
    topicEmoji: "🏮",
    description: "Chinese culture and traditions",
    vocabularyFocus: ["文化", "传统", "节日", "春节", "中秋节", "习俗", "红包", "饺子", "历史", "古代"],
    grammarFocus: ["不但...而且...", "虽然...但是..."],
    estimatedWords: 60
  },
  {
    level: 23,
    hskLevel: 3,
    topic: "Business & Economy",
    topicEmoji: "📈",
    description: "Business, economy, and finance",
    vocabularyFocus: ["生意", "市场", "价格", "质量", "客户", "合同", "投资", "利润", "竞争", "发展"],
    grammarFocus: ["越来越...", "比较..."],
    estimatedWords: 60
  },
  {
    level: 24,
    hskLevel: 3,
    topic: "Relationships & Social",
    topicEmoji: "💑",
    description: "Relationships and social interactions",
    vocabularyFocus: ["朋友", "同学", "邻居", "关系", "结婚", "离婚", "约会", "聊天", "介绍", "认识"],
    grammarFocus: ["跟...一起", "对...感兴趣"],
    estimatedWords: 60
  },
  {
    level: 25,
    hskLevel: 3,
    topic: "News & Media",
    topicEmoji: "📰",
    description: "News, media, and current events",
    vocabularyFocus: ["新闻", "报纸", "电视", "广播", "记者", "采访", "报道", "消息", "重要", "影响"],
    grammarFocus: ["据说...", "听说..."],
    estimatedWords: 60
  },
  {
    level: 26,
    hskLevel: 3,
    topic: "Problems & Solutions",
    topicEmoji: "💡",
    description: "Problem-solving and decision making",
    vocabularyFocus: ["问题", "解决", "办法", "选择", "决定", "计划", "准备", "成功", "失败", "努力"],
    grammarFocus: ["因为...所以...", "如果...就..."],
    estimatedWords: 60
  },
  {
    level: 27,
    hskLevel: 3,
    topic: "Art & Entertainment",
    topicEmoji: "🎨",
    description: "Art, music, and entertainment",
    vocabularyFocus: ["艺术", "画", "音乐会", "演出", "表演", "演员", "导演", "作品", "欣赏", "创作"],
    grammarFocus: ["正在...呢", "一边...一边..."],
    estimatedWords: 60
  },
  {
    level: 28,
    hskLevel: 3,
    topic: "Science & Technology",
    topicEmoji: "🔬",
    description: "Science, research, and innovation",
    vocabularyFocus: ["科学", "研究", "实验", "发明", "技术", "数据", "分析", "结果", "理论", "发现"],
    grammarFocus: ["通过...", "根据..."],
    estimatedWords: 60
  },
  {
    level: 29,
    hskLevel: 3,
    topic: "Law & Government",
    topicEmoji: "⚖️",
    description: "Law, government, and society",
    vocabularyFocus: ["法律", "政府", "规定", "权利", "责任", "公民", "社会", "安全", "警察", "法院"],
    grammarFocus: ["必须...", "应该..."],
    estimatedWords: 60
  },
  {
    level: 30,
    hskLevel: 3,
    topic: "Personal Growth",
    topicEmoji: "🌟",
    description: "Personal development and goals",
    vocabularyFocus: ["目标", "梦想", "进步", "改变", "习惯", "经验", "能力", "信心", "坚持", "放弃"],
    grammarFocus: ["为了...", "除了...以外"],
    estimatedWords: 60
  },

  // HSK 4 (Levels 31-40) - 1200 words total
  {
    level: 31,
    hskLevel: 4,
    topic: "Global Issues",
    topicEmoji: "🌍",
    description: "Global challenges and international affairs",
    vocabularyFocus: ["全球", "国际", "和平", "战争", "贫困", "难民", "合作", "援助", "危机", "解决方案"],
    grammarFocus: ["不仅...而且...", "无论...都..."],
    estimatedWords: 120
  },
  {
    level: 32,
    hskLevel: 4,
    topic: "Psychology & Emotions",
    topicEmoji: "🧠",
    description: "Psychology, emotions, and mental health",
    vocabularyFocus: ["心理", "情绪", "压力", "焦虑", "抑郁", "治疗", "咨询", "理解", "同情", "支持"],
    grammarFocus: ["既...又...", "一方面...另一方面..."],
    estimatedWords: 120
  },
  {
    level: 33,
    hskLevel: 4,
    topic: "Education System",
    topicEmoji: "🎓",
    description: "Higher education and academic life",
    vocabularyFocus: ["大学", "专业", "学位", "奖学金", "申请", "录取", "毕业", "论文", "导师", "研究生"],
    grammarFocus: ["首先...然后...最后...", "不是...而是..."],
    estimatedWords: 120
  },
  {
    level: 34,
    hskLevel: 4,
    topic: "Career Development",
    topicEmoji: "📊",
    description: "Career planning and professional growth",
    vocabularyFocus: ["职业", "简历", "面试", "晋升", "培训", "技能", "经验", "目标", "发展", "机会"],
    grammarFocus: ["尽管...还是...", "即使...也..."],
    estimatedWords: 120
  },
  {
    level: 35,
    hskLevel: 4,
    topic: "Social Media & Internet",
    topicEmoji: "💻",
    description: "Digital life and online culture",
    vocabularyFocus: ["社交媒体", "网站", "应用", "下载", "上传", "分享", "评论", "点赞", "粉丝", "网红"],
    grammarFocus: ["随着...", "由于..."],
    estimatedWords: 120
  },
  {
    level: 36,
    hskLevel: 4,
    topic: "Literature & Writing",
    topicEmoji: "📖",
    description: "Literature, writing, and storytelling",
    vocabularyFocus: ["文学", "小说", "诗歌", "作者", "情节", "人物", "主题", "风格", "创作", "出版"],
    grammarFocus: ["与其...不如...", "要么...要么..."],
    estimatedWords: 120
  },
  {
    level: 37,
    hskLevel: 4,
    topic: "Sports & Competition",
    topicEmoji: "🏆",
    description: "Professional sports and competition",
    vocabularyFocus: ["比赛", "冠军", "运动员", "教练", "训练", "成绩", "纪录", "奥运会", "团队", "策略"],
    grammarFocus: ["只要...就...", "只有...才..."],
    estimatedWords: 120
  },
  {
    level: 38,
    hskLevel: 4,
    topic: "Philosophy & Ethics",
    topicEmoji: "🤔",
    description: "Philosophy, ethics, and moral questions",
    vocabularyFocus: ["哲学", "道德", "价值观", "原则", "真理", "正义", "自由", "责任", "选择", "意义"],
    grammarFocus: ["假如...那么...", "既然...就..."],
    estimatedWords: 120
  },
  {
    level: 39,
    hskLevel: 4,
    topic: "Innovation & Future",
    topicEmoji: "🚀",
    description: "Innovation, future trends, and technology",
    vocabularyFocus: ["创新", "人工智能", "机器人", "自动化", "未来", "预测", "趋势", "变革", "突破", "可持续"],
    grammarFocus: ["将要...", "即将..."],
    estimatedWords: 120
  },
  {
    level: 40,
    hskLevel: 4,
    topic: "Cross-Cultural Communication",
    topicEmoji: "🤝",
    description: "Cultural exchange and communication",
    vocabularyFocus: ["跨文化", "交流", "误解", "尊重", "差异", "共同点", "适应", "融入", "多样性", "包容"],
    grammarFocus: ["相比之下...", "总的来说..."],
    estimatedWords: 120
  },

  // HSK 5 (Levels 41-50) - 2500 words total
  {
    level: 41,
    hskLevel: 5,
    topic: "Economic Development",
    topicEmoji: "💹",
    description: "Economic theories and development",
    vocabularyFocus: ["经济增长", "通货膨胀", "失业率", "供求关系", "市场经济", "宏观调控", "产业结构", "贸易顺差", "汇率", "金融危机"],
    grammarFocus: ["鉴于...", "有鉴于此..."],
    estimatedWords: 250
  },
  {
    level: 42,
    hskLevel: 5,
    topic: "Medical Science",
    topicEmoji: "⚕️",
    description: "Medical advances and healthcare",
    vocabularyFocus: ["诊断", "症状", "治疗方案", "临床试验", "副作用", "免疫系统", "慢性病", "预防医学", "基因", "疫苗"],
    grammarFocus: ["据统计...", "研究表明..."],
    estimatedWords: 250
  },
  {
    level: 43,
    hskLevel: 5,
    topic: "Legal System",
    topicEmoji: "👨‍⚖️",
    description: "Legal system and justice",
    vocabularyFocus: ["立法", "司法", "执法", "宪法", "民法", "刑法", "诉讼", "判决", "上诉", "辩护"],
    grammarFocus: ["依法...", "根据法律规定..."],
    estimatedWords: 250
  },
  {
    level: 44,
    hskLevel: 5,
    topic: "Environmental Protection",
    topicEmoji: "♻️",
    description: "Environmental protection and sustainability",
    vocabularyFocus: ["可持续发展", "碳排放", "温室效应", "生态平衡", "资源枯竭", "循环经济", "清洁能源", "生物多样性", "垃圾分类", "环保意识"],
    grammarFocus: ["为了保护...", "采取措施..."],
    estimatedWords: 250
  },
  {
    level: 45,
    hskLevel: 5,
    topic: "Social Issues",
    topicEmoji: "👥",
    description: "Contemporary social issues",
    vocabularyFocus: ["社会保障", "养老问题", "教育公平", "贫富差距", "性别平等", "就业歧视", "城乡差异", "人口老龄化", "社会矛盾", "公共服务"],
    grammarFocus: ["面临...挑战", "引起...关注"],
    estimatedWords: 250
  },
  {
    level: 46,
    hskLevel: 5,
    topic: "Scientific Research",
    topicEmoji: "🔭",
    description: "Scientific research and discoveries",
    vocabularyFocus: ["假设", "论证", "数据分析", "实验设计", "对照组", "变量", "结论", "学术论文", "同行评审", "研究成果"],
    grammarFocus: ["通过实验证明...", "基于...的研究"],
    estimatedWords: 250
  },
  {
    level: 47,
    hskLevel: 5,
    topic: "International Relations",
    topicEmoji: "🌐",
    description: "Diplomacy and international relations",
    vocabularyFocus: ["外交", "主权", "领土", "条约", "联合国", "多边合作", "双边关系", "国际组织", "制裁", "谈判"],
    grammarFocus: ["在...框架下", "就...达成共识"],
    estimatedWords: 250
  },
  {
    level: 48,
    hskLevel: 5,
    topic: "Cultural Heritage",
    topicEmoji: "🏛️",
    description: "Cultural heritage and preservation",
    vocabularyFocus: ["文化遗产", "非物质文化", "考古", "文物", "保护修复", "世界遗产", "传承", "民间艺术", "传统工艺", "文化认同"],
    grammarFocus: ["作为...的象征", "具有...价值"],
    estimatedWords: 250
  },
  {
    level: 49,
    hskLevel: 5,
    topic: "Modern Philosophy",
    topicEmoji: "💭",
    description: "Modern philosophical thought",
    vocabularyFocus: ["存在主义", "理性主义", "实用主义", "辩证法", "形而上学", "认识论", "伦理学", "美学", "逻辑思维", "批判性思考"],
    grammarFocus: ["从...角度看", "在...意义上"],
    estimatedWords: 250
  },
  {
    level: 50,
    hskLevel: 5,
    topic: "Advanced Business",
    topicEmoji: "🏢",
    description: "Advanced business and management",
    vocabularyFocus: ["战略规划", "市场营销", "供应链", "风险管理", "并购", "股权", "董事会", "年度报告", "利益相关者", "企业文化"],
    grammarFocus: ["致力于...", "旨在..."],
    estimatedWords: 250
  }
];

// Helper functions
export function getLevelInfo(level: number): LevelInfo | undefined {
  return levelStructure.find(l => l.level === level);
}

export function getLevelsByHSK(hskLevel: number): LevelInfo[] {
  return levelStructure.filter(l => l.hskLevel === hskLevel);
}

export function getHSKLevel(level: number): number {
  const info = getLevelInfo(level);
  return info ? info.hskLevel : 1;
}

export function getTotalWordsForHSK(hskLevel: number): number {
  const levels = getLevelsByHSK(hskLevel);
  return levels.reduce((sum, level) => sum + level.estimatedWords, 0);
}

// Get recommended level based on assessment score
export function getRecommendedLevel(assessmentScore: number): number {
  // Map assessment scores to appropriate starting levels
  if (assessmentScore <= 3) return 1;  // HSK 1 start
  if (assessmentScore <= 5) return 5;  // HSK 1 middle
  if (assessmentScore <= 7) return 11; // HSK 2 start
  if (assessmentScore <= 8) return 21; // HSK 3 start
  if (assessmentScore <= 9) return 31; // HSK 4 start
  return 41; // HSK 5 start
}

// Check if user should be allowed to attempt a level
export function canAttemptLevel(userLevel: number, targetLevel: number): boolean {
  // Users can attempt any level, but we'll warn them if it's too advanced
  const userHSK = getHSKLevel(userLevel);
  const targetHSK = getHSKLevel(targetLevel);
  
  // Allow attempting levels within current HSK or one level above
  return targetHSK <= userHSK + 1;
}

export function getDifficultyColor(hskLevel: number): string {
  switch(hskLevel) {
    case 1: return "text-green-600 bg-green-50";
    case 2: return "text-blue-600 bg-blue-50";
    case 3: return "text-purple-600 bg-purple-50";
    case 4: return "text-orange-600 bg-orange-50";
    case 5: return "text-red-600 bg-red-50";
    default: return "text-gray-600 bg-gray-50";
  }
}