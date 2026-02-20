import { SonAction, DialogueTemplate } from '../types';

// ===== 감정 대화 (아들 상태 기반) =====
export const EMOTION_DIALOGUES: DialogueTemplate[] = [
  { id: 'emo-low-hp', type: 'emotion', sonText: '으으... 좀 아프요...', priority: 9,
    conditions: { hpRange: [0, 40] }, choices: [
      { id: 'comfort', text: '어디 보자, 엄마가 봐줄게', effect: { type: 'heal', value: 5, source: '엄마의 손길' } },
      { id: 'encourage', text: '괜찮아, 넌 강한 아이야', effect: { type: 'buff', stat: 'def', value: 1, duration: 60, source: '격려' } },
      { id: 'worry-food', text: '밥은 잘 먹었어?', effect: { type: 'mood', value: 5, source: '걱정' } },
    ] },
  { id: 'emo-hungry', type: 'emotion', sonText: '배고파요...', priority: 8,
    conditions: { hungerRange: [0, 30] }, choices: [
      { id: 'feed', text: '금방 해줄게!', effect: { type: 'mood', value: 5, source: '밥 약속' } },
      { id: 'ack', text: '많이 배고프구나', effect: { type: 'hunger', value: 5, source: '간식' } },
    ] },
  { id: 'emo-return-injured', type: 'emotion', sonText: '힘든 모험이었어요...', priority: 10,
    conditions: { justReturned: true, isInjured: true }, choices: [
      { id: 'comfort', text: '고생했어, 이리 와', effect: { type: 'heal', value: 10, source: '엄마 품' } },
      { id: 'proud', text: '무사히 돌아와서 다행이야', effect: { type: 'exp', value: 5, source: '자부심' } },
      { id: 'rest', text: '푹 쉬어, 엄마가 지켜줄게', effect: { type: 'mood', value: 8, source: '안심' } },
    ] },
  { id: 'emo-return-success', type: 'emotion', sonText: '엄마! 오늘 대박이었어요!', priority: 10,
    conditions: { justReturned: true, isInjured: false }, choices: [
      { id: 'proud', text: '역시 내 아들!', effect: { type: 'mood', value: 8, source: '자랑스러움' } },
      { id: 'curious', text: '어떤 일이 있었는데?', effect: { type: 'exp', value: 3, source: '이야기' } },
    ] },
  { id: 'emo-depart', type: 'emotion', sonText: '다녀올게요, 엄마!', priority: 9,
    conditions: { sonAction: [SonAction.DEPARTING] }, choices: [
      { id: 'bless', text: '힘내, 엄마가 응원해!', effect: { type: 'buff', stat: 'str', value: 1, duration: 120, source: '엄마의 축복' } },
      { id: 'safe', text: '조심히 다녀와', effect: { type: 'buff', stat: 'def', value: 1, duration: 120, source: '엄마의 기도' } },
    ] },
  { id: 'emo-training', type: 'emotion', sonText: '점점 강해지는 것 같아요!', priority: 5,
    conditions: { sonAction: [SonAction.TRAINING] }, choices: [
      { id: 'praise', text: '정말 많이 늘었어!', effect: { type: 'exp', value: 5, source: '칭찬' } },
      { id: 'cheer', text: '계속 힘내!', effect: { type: 'mood', value: 5, source: '응원' } },
    ] },
  { id: 'emo-high-level', type: 'emotion', sonText: '엄마, 나 이제 꽤 강하지?', priority: 4,
    conditions: { minLevel: 10 }, choices: [
      { id: 'agree', text: '그럼! 엄마가 제일 자랑스러워', effect: { type: 'mood', value: 10, source: '인정' } },
      { id: 'worry', text: '그래도 조심해야지', effect: { type: 'buff', stat: 'def', value: 1, duration: 60, source: '걱정' } },
    ] },
  { id: 'emo-low-mood', type: 'emotion', sonText: '엄마... 좀 외로워요...', priority: 8,
    conditions: { sonAction: [SonAction.IDLE, SonAction.RESTING] }, choices: [
      { id: 'hug', text: '이리 와, 안아줄게', effect: { type: 'mood', value: 15, source: '포옹' } },
      { id: 'promise', text: '엄마가 항상 곁에 있을게', effect: { type: 'mood', value: 10, source: '약속' } },
    ] },
  { id: 'emo-reading', type: 'emotion', sonText: '이 책 진짜 재밌어요!', priority: 4,
    conditions: { sonAction: [SonAction.READING] }, choices: [
      { id: 'curious', text: '무슨 내용인데?', effect: { type: 'exp', value: 3, source: '호기심' } },
      { id: 'happy', text: '재밌으면 좋겠다~', effect: { type: 'mood', value: 5, source: '공감' } },
    ] },
  { id: 'emo-resting', type: 'emotion', sonText: '좀 쉬고 싶어요~', priority: 4,
    conditions: { sonAction: [SonAction.RESTING], nearFurniture: ['chair'] }, choices: [
      { id: 'rest', text: '푹 쉬어~', effect: { type: 'heal', value: 3, source: '휴식' } },
      { id: 'snack', text: '간식 먹을래?', effect: { type: 'mood', value: 3, source: '간식' } },
    ] },
  { id: 'emo-idle', type: 'emotion', sonText: '뭐하지~', priority: 2,
    conditions: { sonAction: [SonAction.IDLE] }, choices: [
      { id: 'suggest', text: '훈련이라도 해볼까?', effect: { type: 'mood', value: 3, source: '제안' } },
      { id: 'together', text: '엄마랑 같이 있자', effect: { type: 'mood', value: 5, source: '함께' } },
    ] },
  { id: 'emo-potion', type: 'emotion', sonText: '이 약 맛이...', priority: 4,
    conditions: { sonAction: [SonAction.DRINKING_POTION] }, choices: [
      { id: 'sympathize', text: '맛없지? 참아~', effect: { type: 'mood', value: 3, source: '공감' } },
      { id: 'encourage', text: '몸에 좋은 거야!', effect: { type: 'heal', value: 2, source: '격려' } },
    ] },
];
// ===== 잠자리 대화 (수면 중) =====
export const BEDTIME_DIALOGUES: DialogueTemplate[] = [
  { id: 'bed-adventure', type: 'bedtime', sonText: '엄마, 오늘 무서운 몬스터 만났는데...', priority: 6,
    conditions: { sonAction: [SonAction.SLEEPING] }, choices: [
      { id: 'proud', text: '잘 싸웠구나, 대견해', effect: { type: 'mood', value: 8, source: '칭찬' } },
      { id: 'careful', text: '다음엔 조심해야 해', effect: { type: 'buff', stat: 'def', value: 1, duration: 120, source: '당부' } },
    ] },
  { id: 'bed-grow', type: 'bedtime', sonText: '엄마, 나 많이 컸지?', priority: 5,
    conditions: { sonAction: [SonAction.SLEEPING] }, choices: [
      { id: 'yes', text: '그럼~ 엄마 키 다 따라왔네!', effect: { type: 'mood', value: 10, source: '인정' } },
      { id: 'baby', text: '그래도 엄마한텐 아기야~', effect: { type: 'mood', value: 8, source: '사랑' } },
    ] },
  { id: 'bed-miss', type: 'bedtime', sonText: '모험 갈 때 엄마가 보고 싶어요', priority: 7,
    conditions: { sonAction: [SonAction.SLEEPING] }, choices: [
      { id: 'always', text: '엄마도 항상 생각해', effect: { type: 'mood', value: 10, source: '마음' } },
      { id: 'amulet', text: '부적 만들어줄까?', effect: { type: 'buff', stat: 'str', value: 1, duration: 120, source: '부적' } },
    ] },
  { id: 'bed-food', type: 'bedtime', sonText: '엄마가 만들어준 밥 최고야...', priority: 5,
    conditions: { sonAction: [SonAction.SLEEPING] }, choices: [
      { id: 'happy', text: '맛있게 먹어줘서 고마워', effect: { type: 'mood', value: 8, source: '감사' } },
      { id: 'more', text: '내일 더 맛있는 거 해줄게', effect: { type: 'hunger', value: 5, source: '기대' } },
    ] },
  { id: 'bed-dream', type: 'bedtime', sonText: '꿈에서 드래곤을 이겼어요!', priority: 4,
    conditions: { sonAction: [SonAction.SLEEPING] }, choices: [
      { id: 'amazing', text: '대단한데?!', effect: { type: 'exp', value: 3, source: '상상력' } },
      { id: 'real', text: '언젠가 진짜로도 이길 거야', effect: { type: 'mood', value: 5, source: '믿음' } },
    ] },
  { id: 'bed-tired', type: 'bedtime', sonText: '오늘 좀 힘들었어...', priority: 6,
    conditions: { sonAction: [SonAction.SLEEPING] }, choices: [
      { id: 'good', text: '고생했어, 잘했어', effect: { type: 'mood', value: 8, source: '위로' } },
      { id: 'rest', text: '푹 자, 내일은 더 좋을 거야', effect: { type: 'heal', value: 5, source: '숙면' } },
    ] },
  { id: 'bed-happy', type: 'bedtime', sonText: '오늘 정말 좋은 날이었어요!', priority: 4,
    conditions: { sonAction: [SonAction.SLEEPING] }, choices: [
      { id: 'glad', text: '엄마도 행복했어', effect: { type: 'mood', value: 10, source: '행복' } },
      { id: 'everyday', text: '매일 이렇게 재밌을 거야', effect: { type: 'mood', value: 5, source: '기대' } },
    ] },
  { id: 'bed-question', type: 'bedtime', sonText: '엄마, 영웅이 되면 뭐가 좋아요?', priority: 5,
    conditions: { sonAction: [SonAction.SLEEPING] }, choices: [
      { id: 'help', text: '사람들을 도울 수 있어', effect: { type: 'mood', value: 8, source: '가르침' } },
      { id: 'beyou', text: '네가 하고 싶은 걸 하면 돼', effect: { type: 'mood', value: 10, source: '존중' } },
    ] },
];
// ===== 일상 대화 (가구/활동 기반) =====
export const DAILY_DIALOGUES: DialogueTemplate[] = [
  { id: 'daily-dummy', type: 'daily', sonText: '허수아비 이름 뭐야?', priority: 3,
    conditions: { sonAction: [SonAction.TRAINING], nearFurniture: ['dummy'] }, choices: [
      { id: 'name', text: '음... 허수비라고 하자!', effect: { type: 'mood', value: 5, source: '이름짓기' } },
      { id: 'no', text: '그냥 허수아비야~', effect: { type: 'mood', value: 2, source: '현실' } },
    ] },
  { id: 'daily-table', type: 'daily', sonText: '이거 뭐로 만든 거예요?', priority: 3,
    conditions: { sonAction: [SonAction.EATING], nearFurniture: ['table'] }, choices: [
      { id: 'explain', text: '신선한 재료로 만들었지~', effect: { type: 'mood', value: 5, source: '설명' } },
      { id: 'secret', text: '엄마의 비밀 레시피야!', effect: { type: 'mood', value: 3, source: '비밀' } },
    ] },
  { id: 'daily-desk', type: 'daily', sonText: '이 글자 뭐라고 읽어요?', priority: 3,
    conditions: { sonAction: [SonAction.READING], nearFurniture: ['desk'] }, choices: [
      { id: 'teach', text: '이건 이렇게 읽는 거야', effect: { type: 'exp', value: 3, source: '가르침' } },
      { id: 'self', text: '한번 스스로 읽어봐!', effect: { type: 'mood', value: 2, source: '자립' } },
    ] },
  { id: 'daily-chair', type: 'daily', sonText: '엄마도 쉬세요~', priority: 3,
    conditions: { sonAction: [SonAction.RESTING], nearFurniture: ['chair'] }, choices: [
      { id: 'sweet', text: '우리 아들 착하기도~', effect: { type: 'mood', value: 8, source: '감동' } },
      { id: 'fine', text: '엄마는 괜찮아~', effect: { type: 'mood', value: 3, source: '대화' } },
    ] },
  { id: 'daily-potion', type: 'daily', sonText: '포션이 반짝반짝해요!', priority: 2,
    conditions: { nearFurniture: ['potionShelf'] }, choices: [
      { id: 'pretty', text: '예쁘지?', effect: { type: 'mood', value: 3, source: '공감' } },
      { id: 'careful', text: '함부로 만지면 안 돼~', effect: { type: 'mood', value: 2, source: '주의' } },
    ] },
  { id: 'daily-equip', type: 'daily', sonText: '이 갑옷 멋있다!', priority: 3,
    conditions: { nearFurniture: ['equipmentRack'] }, choices: [
      { id: 'wear', text: '잘 입고 다녀~', effect: { type: 'mood', value: 5, source: '기대' } },
      { id: 'made', text: '엄마가 만든 거야!', effect: { type: 'mood', value: 8, source: '자부심' } },
    ] },
  { id: 'daily-bed', type: 'daily', sonText: '이불이 따뜻해~', priority: 2,
    conditions: { nearFurniture: ['bed'] }, choices: [
      { id: 'snuggle', text: '포근하지?', effect: { type: 'mood', value: 5, source: '포근' } },
      { id: 'wash', text: '곧 빨래해야겠다~', effect: { type: 'mood', value: 2, source: '일상' } },
    ] },
  { id: 'daily-door', type: 'daily', sonText: '밖에 뭐가 있을까?', priority: 3,
    conditions: { sonAction: [SonAction.IDLE], nearFurniture: ['door'] }, choices: [
      { id: 'adventure', text: '모험이 기다리고 있지!', effect: { type: 'mood', value: 5, source: '설렘' } },
      { id: 'careful', text: '조심해야 해~', effect: { type: 'mood', value: 3, source: '당부' } },
    ] },
  { id: 'daily-train-hard', type: 'daily', sonText: '얍! 얍! 엄마 보고 있어?', priority: 4,
    conditions: { sonAction: [SonAction.TRAINING] }, choices: [
      { id: 'watch', text: '응! 멋있다~', effect: { type: 'mood', value: 8, source: '관심' } },
      { id: 'careful', text: '다치지 않게 조심해~', effect: { type: 'mood', value: 3, source: '걱정' } },
    ] },
  { id: 'daily-eat-happy', type: 'daily', sonText: '냠냠~ 한 입만 더!', priority: 3,
    conditions: { sonAction: [SonAction.EATING] }, choices: [
      { id: 'more', text: '그래, 많이 먹어~', effect: { type: 'hunger', value: 3, source: '추가' } },
      { id: 'save', text: '아껴 먹어야지~', effect: { type: 'mood', value: 3, source: '훈육' } },
    ] },
];
// ===== 요청 대화 (퀘스트 트리거) =====
type RC = [{ id: string; text: string; effect: { type: 'mood'; value: number; source: string } }, { id: string; text: string; effect: { type: 'mood'; value: number; source: string } }];
const rc = (v = 5): RC => [{ id: 'accept', text: '그래, 해줄게!', effect: { type: 'mood', value: v, source: '약속' } }, { id: 'decline', text: '지금은 좀 어렵겠다...', effect: { type: 'mood', value: -2, source: '아쉬움' } }];

export const REQUEST_DIALOGUES: DialogueTemplate[] = [
  { id: 'req-stew', type: 'request', sonText: '고기 스튜 먹고 싶어요...', priority: 6, choices: rc(), conditions: { sonAction: [SonAction.IDLE, SonAction.RESTING] },
    questData: { objectives: [{ type: 'craft_food', targetId: 'meat_stew', targetAmount: 1 }], deadlineSeconds: 180, reward: { type: 'buff', description: 'STR+2', stat: 'str', value: 2 }, failPenalty: { type: 'mood', description: '실망', value: -5 } } },
  { id: 'req-sword', type: 'request', sonText: '새 검이 있으면 좋겠어요', priority: 6, choices: rc(), conditions: { sonAction: [SonAction.TRAINING, SonAction.IDLE] },
    questData: { objectives: [{ type: 'craft_equipment', targetId: 'iron_sword', targetAmount: 1 }], deadlineSeconds: 240, reward: { type: 'exp', description: 'EXP+15', value: 15 }, failPenalty: { type: 'mood', description: '실망', value: -8 } } },
  { id: 'req-potion', type: 'request', sonText: '체력 포션이 떨어졌어요', priority: 7, choices: rc(), conditions: { sonAction: [SonAction.IDLE, SonAction.RESTING] },
    questData: { objectives: [{ type: 'brew_potion', targetId: 'health_potion', targetAmount: 1 }], deadlineSeconds: 120, reward: { type: 'mood', description: '기쁨+10', value: 10 }, failPenalty: { type: 'mood', description: '불안', value: -5 } } },
  { id: 'req-book', type: 'request', sonText: '책 읽고 싶은데 없어요', priority: 5, choices: rc(), conditions: { sonAction: [SonAction.IDLE], nearFurniture: ['desk'] },
    questData: { objectives: [{ type: 'place_book', targetAmount: 1 }], deadlineSeconds: 60, reward: { type: 'buff', description: 'INT+1', stat: 'int', value: 1 }, failPenalty: { type: 'mood', description: '아쉬움', value: -3 } } },
  { id: 'req-bread', type: 'request', sonText: '빵이라도 있으면 좋겠어요...', priority: 6, choices: rc(), conditions: { hungerRange: [0, 50] },
    questData: { objectives: [{ type: 'place_any_food', targetAmount: 1 }], deadlineSeconds: 90, reward: { type: 'mood', description: '행복+8', value: 8 }, failPenalty: { type: 'mood', description: '배고픔', value: -5 } } },
  { id: 'req-herb', type: 'request', sonText: '약초가 좀 필요해요', priority: 5, choices: rc(), conditions: { sonAction: [SonAction.IDLE, SonAction.RESTING] },
    questData: { objectives: [{ type: 'gather_material', targetId: 'redHerb', targetAmount: 3 }], deadlineSeconds: 300, reward: { type: 'materials', description: '금화 20', value: 20 }, failPenalty: { type: 'mood', description: '실망', value: -5 } } },
  { id: 'req-armor', type: 'request', sonText: '갑옷이 좀 약한 것 같아요...', priority: 6, choices: rc(), conditions: { sonAction: [SonAction.IDLE, SonAction.TRAINING] },
    questData: { objectives: [{ type: 'craft_equipment', targetId: 'leather_armor', targetAmount: 1 }], deadlineSeconds: 240, reward: { type: 'buff', description: 'DEF+2', stat: 'def', value: 2 }, failPenalty: { type: 'mood', description: '불안', value: -8 } } },
  { id: 'req-place-potion', type: 'request', sonText: '물약을 좀 챙겨주세요', priority: 5, choices: rc(), conditions: { sonAction: [SonAction.IDLE] },
    questData: { objectives: [{ type: 'place_potion', targetAmount: 1 }], deadlineSeconds: 90, reward: { type: 'mood', description: '안심+8', value: 8 }, failPenalty: { type: 'mood', description: '아쉬움', value: -3 } } },
];

// ===== 전체 대화 합본 =====
export const ALL_DIALOGUES: DialogueTemplate[] = [...EMOTION_DIALOGUES, ...BEDTIME_DIALOGUES, ...DAILY_DIALOGUES, ...REQUEST_DIALOGUES];

// ===== 반응 대사 (선택 후 아들 리액션) =====
export const RESPONSE_LINES: Record<string, string[]> = {
  emotion: ['고마워요, 엄마!', '엄마 최고!', '히히, 기분 좋다~'],
  bedtime: ['잘 자요, 엄마...', '내일도 화이팅...zzZ', '사랑해요, 엄마...'],
  daily: ['헤헤~', '엄마 재밌다!', '앗, 그렇구나!'],
  request: ['약속이다!', '고마워요!', '기대할게요!'],
  decline: ['괜찮아요...', '다음에요...', '알겠어요...'],
  questComplete: ['와! 고마워요 엄마!', '엄마 최고예요!', '역시 우리 엄마!'],
  questFail: ['괜찮아요, 다음에...', '아쉽지만 이해해요', '바쁘셨죠...'],
};
