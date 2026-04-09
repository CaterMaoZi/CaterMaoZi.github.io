// SBTI Personality Test - Main Application Logic

const dimensionMeta = {
  S1: { name: 'S1 自尊自信', model: '自我模型' },
  S2: { name: 'S2 自我清晰度', model: '自我模型' },
  S3: { name: 'S3 核心价值', model: '自我模型' },
  E1: { name: 'E1 依恋安全感', model: '情感模型' },
  E2: { name: 'E2 情感投入度', model: '情感模型' },
  E3: { name: 'E3 边界与依赖', model: '情感模型' },
  A1: { name: 'A1 世界观倾向', model: '态度模型' },
  A2: { name: 'A2 规则与灵活度', model: '态度模型' },
  A3: { name: 'A3 人生意义感', model: '态度模型' },
  Ac1: { name: 'Ac1 动机导向', model: '行动驱力模型' },
  Ac2: { name: 'Ac2 决策风格', model: '行动驱力模型' },
  Ac3: { name: 'Ac3 执行模式', model: '行动驱力模型' },
  So1: { name: 'So1 社交主动性', model: '社交模型' },
  So2: { name: 'So2 人际边界感', model: '社交模型' },
  So3: { name: 'So3 表达与真实度', model: '社交模型' }
};

const questions = [
  { id: 'q1', dim: 'S1', text: '我不仅是屌丝，我还是joker,我还是咸鱼，这辈子没谈过一场恋爱，胆怯又自卑，我的青春就是一场又一场的yiyin，每一天幻想着我也能有一个女孩子和我一起压马路，一起逛街，一起玩，现实却是爆了父母金币，读了个烂学校，混日子之后找班上，没有理想，没有目标，没有能力的三无人员，每次看到你能在网上开屌丝的玩笑，我都想哭，我就是地底下的老鼠，透过下水井的缝隙，窥探地上的各种美好，每一次看到这种都是对我心灵的一次伤害，对我生存空间的一次压缩，求求哥们给我们这种小丑一点活路吧，我真的不想在白天把枕巾哭湿一大片', options: [{ label: '我哭了。。', value: 1 }, { label: '这是什么。。', value: 2 }, { label: '这不是我！', value: 3 }] },
  { id: 'q2', dim: 'S1', text: '我不够好，周围的人都比我优秀', options: [{ label: '确实', value: 1 }, { label: '有时', value: 2 }, { label: '不是', value: 3 }] },
  { id: 'q3', dim: 'S2', text: '我很清楚真正的自己是什么样的', options: [{ label: '不认同', value: 1 }, { label: '中立', value: 2 }, { label: '认同', value: 3 }] },
  { id: 'q4', dim: 'S2', text: '我的梦想是成为V圈热机', options: [{ label: '不认同', value: 1 }, { label: '中立', value: 2 }, { label: '认同', value: 3 }] },
  { id: 'q5', dim: 'S3', text: '我一定要不断往上爬、变得更小众，成为小众逼', options: [{ label: '不认同', value: 1 }, { label: '中立', value: 2 }, { label: '认同', value: 3 }] },
  { id: 'q6', dim: 'S3', text: '被投厕对我来说无所吊谓。', options: [{ label: '不认同', value: 1 }, { label: '中立', value: 2 }, { label: '认同', value: 3 }] },
  { id: 'q7', dim: 'E1', text: '对象超过5小时没回消息，说自己在打瓦，你会怎么想？', options: [{ label: '打瓦不可能5小时，也许ta隐瞒了我。', value: 1 }, { label: '在信任和怀疑之间摇摆。', value: 2 }, { label: '他(她)一定是在玩原神！', value: 3 }] },
  { id: 'q8', dim: 'E1', text: '我在感情里经常担心对面是吉他张开的小号', options: [{ label: '是的', value: 1 }, { label: '偶尔', value: 2 }, { label: '不是', value: 3 }] },
  { id: 'q9', dim: 'E2', text: '我对天发誓，我对待每一份感情都是认真的！', options: [{ label: '并没有', value: 1 }, { label: '也许？', value: 2 }, { label: '是的！（问心无愧骄傲脸）', value: 3 }] },
  { id: 'q10', dim: 'E2', text: '你的恋爱对象是一个尊老爱幼，温柔敦厚，洁身自好，光明磊落，大义凛然，能言善辩，口才流利，观察入微，见多识广，博学多才，诲人不倦，和蔼可亲，平易近人，心地善良，慈眉善目，积极进取，意气风发，玉树临风，国色天香，倾国倾城，花容月貌的人，此时你会？', options: [{ label: '就算ta再优秀我也不会陷入太深。', value: 1 }, { label: '会天天把他发朋友圈然后双人推图圈钱', value: 2 }, { label: '会非常珍惜ta，也许会变成恋爱脑。', value: 3 }] },
  { id: 'q11', dim: 'E3', text: '恋爱后，对象非常黏人，你作何感想？', options: [{ label: '那很爽了', value: 1 }, { label: '都行无所谓', value: 2 }, { label: '我更喜欢保留独立空间', value: 3 }] },
  { id: 'q12', dim: 'E3', text: '我在任何关系里都很重视个人空间', options: [{ label: '我更喜欢依赖与被依赖', value: 1 }, { label: '看情况', value: 2 }, { label: '是的！（斩钉截铁地说道）', value: 3 }] },
  { id: 'q13', dim: 'A1', text: '大多数人是善良的', options: [{ label: '其实邪恶的人心比世界上的柜子更多。', value: 1 }, { label: '也许吧。', value: 2 }, { label: '是的，我愿相信好人更多。', value: 3 }] },
  { id: 'q14', dim: 'A1', text: '你走在街上，一位萌萌的小女孩蹦蹦跳跳地朝你走来，突然跳起了求送小女孩滚滚伙伴', options: [{ label: '呜呜她真好真可爱！送她滚滚伙伴', value: 3 }, { label: '一脸懵逼，作挠头状', value: 2 }, { label: '和她对跳', value: 1 }] },
  { id: 'q15', dim: 'A2', text: '快考试了，学校规定必须上晚自习，请假会扣分，但今晚你约了女/男神一起玩《原神》，你怎么办？', options: [{ label: '翘了！反正就一次！', value: 1 }, { label: '干脆请个假吧。', value: 2 }, { label: '原神启动', value: 3 }] },
  { id: 'q16', dim: 'A2', text: '我喜欢打破常规，不喜欢被束缚', options: [{ label: '认同', value: 1 }, { label: '保持中立', value: 2 }, { label: '不认同', value: 3 }] },
  { id: 'q17', dim: 'A3', text: '我做事通常有目标。', options: [{ label: '不认同', value: 1 }, { label: '中立', value: 2 }, { label: '认同', value: 3 }] },
  { id: 'q18', dim: 'A3', text: '突然某一天，我意识到人生哪有什么他妈的狗屁意义，人不过是和动物一样被各种欲望支配着，纯纯是被激素控制的东西，饿了就吃，困了就睡，一发情就想交配，我们简直和猪狗一样没什么区别。', options: [{ label: '是这样的。', value: 1 }, { label: '也许是，也许不是。', value: 2 }, { label: '这简直是胡扯', value: 3 }] },
  { id: 'q19', dim: 'Ac1', text: '我做事主要为了取得成果和进步，而不是避免麻烦和风险。', options: [{ label: '不认同', value: 1 }, { label: '中立', value: 2 }, { label: '认同', value: 3 }] },
  { id: 'q20', dim: 'Ac1', text: '走在大街上，你隐隐约约看见前面有一个红白双拼假发的COSPLAYER，你会？', options: [{ label: '跑过去薅假发', value: 1 }, { label: '拍视频做瓜条成为V圈热机', value: 2 }, { label: '上去跳求送小女孩滚滚伙伴', value: 3 }] },
  { id: 'q21', dim: 'Ac2', text: '我做决定比较果断，不喜欢犹豫', options: [{ label: '不认同', value: 1 }, { label: '中立', value: 2 }, { label: '认同', value: 3 }] },
  { id: 'q22', dim: 'Ac2', text: '此题没有题目，请盲选', options: [{ label: '唱跳', value: 1 }, { label: 'Rap', value: 2 }, { label: '篮球', value: 3 }] },
  { id: 'q23', dim: 'Ac3', text: '别人说你"执行力强"，你内心更接近哪句？', options: [{ label: '我被逼到最后确实执行力超强。。。', value: 1 }, { label: '啊，有时候吧。', value: 2 }, { label: '是的，事情本来就该被推进', value: 3 }] },
  { id: 'q24', dim: 'Ac3', text: '我做事常常有计划，____', options: [{ label: '然而计划不如变化快。', value: 1 }, { label: '有时能完成，有时不能。', value: 2 }, { label: '我讨厌被打破计划。', value: 3 }] },
  { id: 'q25', dim: 'So1', text: '你因玩《第五人格》而结识许多网友，并被邀请线下见面，你的想法是？', options: [{ label: '网上口嗨下就算了，真见面还是有点忐忑。', value: 1 }, { label: '见网友也挺好，反正谁来聊我就聊两句。', value: 2 }, { label: '我会打扮一番并热情聊天，万一呢，我是说万一呢？', value: 3 }] },
  { id: 'q26', dim: 'So1', text: '热机线下见面，你的朋友带了ta的朋友(另一个热机)一起来玩，你最可能的状态是', options: [{ label: '对"朋友的热机朋友"天然有点距离感，怕晚上回去在朋友圈看见自己瓜条', value: 1 }, { label: '看对方，能玩就玩。', value: 2 }, { label: '和朋友的热机朋友扩列，找个时间一起撕逼', value: 3 }] },
  { id: 'q27', dim: 'So2', text: '有一天，你发现你刚蹲的好感女神把你删了，你会？', options: [{ label: '把他加回来，并询问自己错在哪里', value: 3 }, { label: '把你的红色感叹号截图，配上赞赏码发朋友圈装惨圈钱', value: 2 }, { label: '加回来，单删v我50', value: 1 }] },
  { id: 'q28', dim: 'So2', text: '我渴望和我信任的人关系密切，熟得像失散多年的亲戚。', options: [{ label: '认同', value: 1 }, { label: '中立', value: 2 }, { label: '不认同', value: 3 }] },
  { id: 'q29', dim: 'So3', text: '有时候你明明对一件事有不同的、负面的看法，但最后没说出来。多数情况下原因是：', options: [{ label: '这种情况较少。', value: 1 }, { label: '可能碍于情面或者关系。', value: 2 }, { label: '不想让别人知道自己是个阴暗的小众逼。', value: 3 }] },
  { id: 'q30', dim: 'So3', text: '我在不同人面前会表现出不一样的自己', options: [{ label: '不认同', value: 1 }, { label: '中立', value: 2 }, { label: '认同', value: 3 }] }
];

const specialQuestions = [
  { id: 'drink_gate_q1', special: true, kind: 'drink_gate', text: '您平时有什么爱好？', options: [{ label: '撕逼', value: 1 }, { label: '喝魔爪', value: 2 }, { label: '喝酒', value: 3 }, { label: '玩原神', value: 4 }] },
  { id: 'drink_gate_q2', special: true, kind: 'drink_trigger', text: '您对饮酒的态度是？', options: [{ label: '小酌怡情，喝不了太多。', value: 1 }, { label: '我习惯将白酒灌在保温杯，当白开水喝，酒精令我信服。', value: 2 }] }
];
