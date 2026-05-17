export interface ChecklistOption {
  value: string;
  label: string;
  description?: string;
}

export const actionOptions: ChecklistOption[] = [
  {
    value: "큰소리",
    label: "큰소리·꾸짖음·야단",
    description: "훈육 목적의 큰 목소리·단호한 말투",
  },
  {
    value: "신체접촉",
    label: "잡거나·끌거나·만짐",
    description: "어깨·팔·손목 등 접촉",
  },
  {
    value: "분리",
    label: "분리·자리이동·복도세움",
    description: "수업방해 학생을 잠시 분리",
  },
  {
    value: "휴대폰",
    label: "휴대전화·소지품 수거",
    description: "수업 중 회수",
  },
  {
    value: "과제",
    label: "반성문·추가과제 부과",
    description: "베껴쓰기 포함",
  },
  {
    value: "차별의심",
    label: "활동 제외·차별 의심",
    description: "특정 학생 배제 의혹",
  },
  {
    value: "체벌",
    label: "체벌·때림",
    description: "신체학대로 분류될 수 있음",
  },
];

export const situationOptions: ChecklistOption[] = [
  { value: "수업중", label: "수업 중" },
  { value: "쉬는시간", label: "쉬는 시간·점심시간" },
  { value: "생활지도", label: "생활지도 상황" },
  { value: "특별활동", label: "특별활동·체험학습" },
  { value: "등하교", label: "등하교 시간" },
];

export const gradeOptions: ChecklistOption[] = [
  { value: "초저학년", label: "초등 1-2학년" },
  { value: "초중학년", label: "초등 3-4학년" },
  { value: "초고학년", label: "초등 5-6학년" },
  { value: "중학교", label: "중학교" },
  { value: "고등학교", label: "고등학교" },
];

export const repeatOptions: ChecklistOption[] = [
  { value: "일회성", label: "일회성", description: "한 번만 발생" },
  { value: "반복적", label: "반복적", description: "여러 차례·지속적" },
];

export type RepeatValue = "일회성" | "반복적";

export const injuryOptions: ChecklistOption[] = [
  { value: "없음", label: "없음", description: "신체 접촉 없거나 흔적 없음" },
  { value: "경미", label: "경미", description: "일시적 자국·빨갛게 됨" },
  { value: "중간", label: "중간", description: "멍·통증 지속" },
  { value: "심각", label: "심각", description: "부상·병원 진료" },
];

export type InjuryValue = "없음" | "경미" | "중간" | "심각";

export const victimCountOptions: ChecklistOption[] = [
  { value: "1명", label: "한 명" },
  { value: "소수", label: "소수 (2-3명)" },
  { value: "다수", label: "다수 (4명 이상)" },
];

export type VictimCountValue = "1명" | "소수" | "다수";
