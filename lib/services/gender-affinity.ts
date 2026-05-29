const MALE_LEANING = [
  "机械",
  "土木",
  "采矿",
  "冶金",
  "船舶",
  "兵器",
  "车辆",
  "电气",
  "自动化",
  "能源动力",
  "测绘",
  "地质",
  "石油",
  "勘查",
];

const FEMALE_LEANING = [
  "护理",
  "学前教育",
  "小学教育",
  "汉语言文学",
  "外国语",
  "翻译",
  "会计",
  "财务管理",
  "人力资源",
  "旅游管理",
  "服装",
  "播音主持",
];

export type Gender = "M" | "F";

export function getGenderAffinity(majorName: string, gender: Gender): number {
  const isMaleLeaning = MALE_LEANING.some((kw) => majorName.includes(kw));
  const isFemaleLeaning = FEMALE_LEANING.some((kw) => majorName.includes(kw));

  if (!isMaleLeaning && !isFemaleLeaning) return 0;

  if (gender === "M") return isMaleLeaning ? 0.5 : -0.3;
  return isFemaleLeaning ? 0.5 : -0.3;
}

export function getGenderAffinityLabel(majorName: string, gender: Gender): string | null {
  const isMaleLeaning = MALE_LEANING.some((kw) => majorName.includes(kw));
  const isFemaleLeaning = FEMALE_LEANING.some((kw) => majorName.includes(kw));

  if (gender === "M" && isMaleLeaning) return "该专业方向在男生中较受欢迎";
  if (gender === "F" && isFemaleLeaning) return "该专业方向在女生中较受欢迎";
  return null;
}
