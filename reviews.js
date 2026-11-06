/* 示例评价数据（非高德地图抓取内容）
 * 以下 20 个景区各 2 条评价，由本项目作者依据各景区公开资料撰写，
 * 仅用于演示详情页评价模块的排版与交互，不代表真实游客评价。
 * 如需接入真实评价，请替换 store.js 中的 getReviews / saveReview 并接入后端服务。
 */
(function (global) {
  'use strict';

  global.GZ_SAMPLE_REVIEWS = {
    'huangguoshu': [
      {
        username: '山野漫游',
        rating: 5,
        updatedAt: '2026-08-16',
        content: '八月中旬去的，水量正大，还没走到观景台就听见轰鸣。水帘洞排队约四十分钟，洞里全身湿透但很值。建议七点半进园，先看大瀑布，再去陡坡塘，最后天星桥，一天刚好。'
      },
      {
        username: '阿栗',
        rating: 4,
        updatedAt: '2026-05-03',
        content: '景区很大，走路多，别穿白鞋。天星桥的石林比想象中好看，只是台阶多、路线绕。旺季门票 160 元，学生证能省一半，记得带雨衣。'
      }
    ],
    'libo-xiaoqikong': [
      {
        username: '小满',
        rating: 5,
        updatedAt: '2026-07-21',
        content: '水上森林可以光脚下水，水凉得舒服，记得带防滑凉鞋和一套换洗衣物。小七孔古桥早上人少、光线柔和，拍照最好在八点前。'
      },
      {
        username: '三条鱼',
        rating: 4,
        updatedAt: '2025-10-12',
        content: '从西门进比较顺，卧龙潭的水是那种透亮的碧绿。景区摆渡车要单独买票，几个点之间步行不短，安排大半天比较稳妥。'
      }
    ],
    'fanjingshan': [
      {
        username: '云上走路',
        rating: 5,
        updatedAt: '2026-09-06',
        content: '凌晨四点从江口出发，索道加爬台阶上红云金顶，正好赶上云海散开。金顶那段台阶很陡，得手脚并用，恐高的人要有心理准备。'
      },
      {
        username: '老周',
        rating: 4,
        updatedAt: '2026-04-18',
        content: '山上十度左右，夏天也要带件冲锋衣。预约名额紧张，提前几天抢票；门票加索道往返接近三百，不过风景确实值。'
      }
    ],
    'qingyan': [
      {
        username: '鹿鸣',
        rating: 5,
        updatedAt: '2026-06-14',
        content: '从北门进去先登城墙，俯瞰整片青瓦屋顶很出片。状元蹄和玫瑰冰浆一定要试，下午三四点人少些，慢慢逛半天正好。'
      },
      {
        username: '布丁',
        rating: 4,
        updatedAt: '2025-11-02',
        content: '古镇免费，但状元府、慈云寺这些要联票 80 元，看兴趣买。周末主街人挤人，往巷子深处走反而安静；石板路滑，穿平底鞋。'
      }
    ],
    'zhenyuan': [
      {
        username: '夜航船',
        rating: 5,
        updatedAt: '2026-08-02',
        content: '晚上坐在祝圣桥边看两岸灯笼倒影，比白天更有味道。青龙洞贴着崖壁建，门票不贵，值得上去看一次全城。'
      },
      {
        username: '阿蛮',
        rating: 4,
        updatedAt: '2026-02-11',
        content: '古城本身不收费，沿㵲阳河走一圈两个小时。石板路窄，车停在外围；淡季住宿一百多，比凤凰安静很多，适合慢慢待一天。'
      }
    ],
    'chishui-danxia': [
      {
        username: '竹影',
        rating: 5,
        updatedAt: '2026-09-20',
        content: '两天跑了佛光岩和四洞沟，红色崖壁配竹海的颜色反差特别强。四洞沟一路都是小瀑布，水量不大但清凉，夏天走很舒服。'
      },
      {
        username: '北纬',
        rating: 4,
        updatedAt: '2025-08-09',
        content: '景点分散，没车比较麻烦，建议住赤水市区自驾或包车。各片区单独买票，两天门票两百多，提前排路线能省不少路上时间。'
      }
    ],
    'baili-dujuan': [
      {
        username: '花间',
        rating: 5,
        updatedAt: '2026-04-05',
        content: '清明前后去的普底，满山粉紫和白色的杜鹃，走在花丛里像掉进云里。花期只有一个月，出发前最好先看景区花讯。'
      },
      {
        username: '石桥',
        rating: 4,
        updatedAt: '2025-03-28',
        content: '景区很大，摆渡车路线要提前搞清楚，不然容易走回头路。花期门票一百，人多但秩序还行，彝寨的坨坨肉值得尝。'
      }
    ],
    'zhijin-cave': [
      {
        username: '地下河',
        rating: 5,
        updatedAt: '2026-07-30',
        content: '洞里恒温，夏天进去像开了空调，记得带件薄外套。银雨树和霸王盔的灯光打得很好，讲解员说全程走完大概两小时。'
      },
      {
        username: '茶马',
        rating: 4,
        updatedAt: '2026-01-16',
        content: '门票 120 略贵，但洞厅规模确实震撼，是国内看过最气派的一个。地面湿滑、台阶多，膝盖不好的人慢慢走，洞里拍照手别抖。'
      }
    ],
    'xijiang': [
      {
        username: '半山灯火',
        rating: 5,
        updatedAt: '2026-08-22',
        content: '住在半山腰的民宿，晚上推开窗就是整片灯火，值回票价。第二天早上去观景台看晨雾里的吊脚楼，比夜景还安静。'
      },
      {
        username: '米酒',
        rating: 4,
        updatedAt: '2026-05-15',
        content: '商业化确实重，主街全是旅拍和银饰店，往寨子深处走才有生活气。长桌宴和苗族歌舞可以看一次，酸汤鱼别忘了点。'
      }
    ],
    'zhaoxing': [
      {
        username: '侗歌',
        rating: 5,
        updatedAt: '2026-06-28',
        content: '晚上八点的侗族大歌在鼓楼前唱，没有伴奏却很好听，多声部现场听才震撼。第二天走堂安梯田，一路都是水稻和木楼。'
      },
      {
        username: '慢邮',
        rating: 4,
        updatedAt: '2025-09-14',
        content: '寨子比西江安静，商业化少，晚上灯光不刺眼。门票 80 含观光车，高铁站有直达车，住一晚看夜景和晨雾比较划算。'
      }
    ],
    'malinghe': [
      {
        username: '水帘',
        rating: 5,
        updatedAt: '2026-07-12',
        content: '沿绝壁栈道走，头顶不断有水帘落下来，雨衣一定要买。夏天漂流很爽，全程一个多小时，衣服肯定会湿。'
      },
      {
        username: '阿吉',
        rating: 4,
        updatedAt: '2026-03-23',
        content: '从兴义市区过去很近，半天足够。栈道窄而且湿，鞋底防滑很重要；瀑布多的季节最好看，枯水期气势会差一些。'
      }
    ],
    'wanfenglin': [
      {
        username: '田埂',
        rating: 5,
        updatedAt: '2026-09-12',
        content: '在纳灰村租车沿田间小路骑，两边全是锥形山峰，油菜花开的时候整片金黄。傍晚在观峰台看日落，很值。'
      },
      {
        username: '小禾',
        rating: 4,
        updatedAt: '2026-06-01',
        content: '门票 70 含观光车，八个观景台一路停下来拍照。村里吃碗蛋炒饭配折耳根，比景区餐厅便宜；太阳大，帽子和防晒别忘。'
      }
    ],
    'tianhetan': [
      {
        username: '周末出逃',
        rating: 5,
        updatedAt: '2026-08-08',
        content: '从贵阳开车四十分钟，水溶洞坐船进去，水道窄，船工撑着走，灯光照得钟乳石很好看，夏天洞里特别凉快。'
      },
      {
        username: '果果',
        rating: 4,
        updatedAt: '2025-12-06',
        content: '门票 50，溶洞船票另算。景区不算大，慢慢走两三个小时；周末亲子游的人多，想安静可以选工作日，公交也能到。'
      }
    ],
    'nanjiang': [
      {
        username: '漂流瓶',
        rating: 5,
        updatedAt: '2026-07-26',
        content: '漂流那段水流急、落差大，全程尖叫，救生衣一定要系紧。漂完在布依村寨吃顿农家饭，一天安排得很满。'
      },
      {
        username: '石阶',
        rating: 4,
        updatedAt: '2026-05-30',
        content: '自驾一个多小时，公共交通不太方便。峡谷栈道阴凉，夏天走不晒；漂流另买票，记得带一套干衣服和防水袋。'
      }
    ],
    'zunyi-meeting': [
      {
        username: '远方来信',
        rating: 5,
        updatedAt: '2026-09-28',
        content: '提前在小程序预约，凭身份证进。二层小楼保持原样，陈列馆的史料很详实，看完再去老城吃碗羊肉粉，半天就过去了。'
      },
      {
        username: '阿禾',
        rating: 4,
        updatedAt: '2026-04-27',
        content: '免费参观但名额有限，节假日要提前几天约。讲解场次固定，跟着听比自己看收获大；周边停车位紧张，建议坐公交。'
      }
    ],
    'loushanguan': [
      {
        username: '松风',
        rating: 5,
        updatedAt: '2026-10-04',
        content: '关口风很大，站在战斗遗址往下看，山谷一层层叠过去，能理解为什么这里叫险隘。摩崖石刻就在路边，顺路就能看完。'
      },
      {
        username: '老陈',
        rating: 4,
        updatedAt: '2026-06-09',
        content: '免费开放，从遵义市区开车四十分钟。山上温度低两三度，秋冬要加衣；徒步路线不长但台阶多，老人孩子量力而行。'
      }
    ],
    'jiaxiulou': [
      {
        username: '南明河',
        rating: 5,
        updatedAt: '2026-08-30',
        content: '傍晚沿南明河散步到甲秀楼，灯亮起来以后楼和浮玉桥的倒影很好看，本地人也在这儿遛弯，很生活化。'
      },
      {
        username: '晚风',
        rating: 4,
        updatedAt: '2026-03-07',
        content: '免费，楼不大，一小时能看完。想上楼要留意开放时间，我去晚了已经关门；周边小吃多，顺便逛逛翠微园。'
      }
    ],
    'gz-museum': [
      {
        username: '博物志',
        rating: 5,
        updatedAt: '2026-09-18',
        content: '民族展厅的服饰和银饰太精美，古生物展厅的贵州龙化石也值得看。免费预约，周一闭馆，别白跑一趟。'
      },
      {
        username: '秋秋',
        rating: 4,
        updatedAt: '2026-02-20',
        content: '馆内很大，两个小时只看了两个展厅。建议先看三层的民族贵州，再回来看历史；馆内冷气足，夏天待着很舒服。'
      }
    ],
    'yelanggu': [
      {
        username: '石像',
        rating: 5,
        updatedAt: '2026-06-21',
        content: '宋培伦一个人垒了二十年的石头城堡，石柱上的傩面表情各不相同，阴天拍照更有味道。面积不大，但细节很多。'
      },
      {
        username: '米线',
        rating: 4,
        updatedAt: '2025-10-26',
        content: '门票 20，离青岩古镇不远，可以顺路一起逛。雨后地面泥泞，穿好走的鞋；周末有手作市集，人少的时候更安静。'
      }
    ],
    'zhenshan': [
      {
        username: '石板巷',
        rating: 5,
        updatedAt: '2026-07-05',
        content: '整个村子都是石板房，巷子窄得只容一人过，走到底是花溪水库，水面很静。中午在农家吃糟辣椒炒肉，价格实在。'
      },
      {
        username: '小鹿',
        rating: 4,
        updatedAt: '2026-04-11',
        content: '免费，从贵阳开车半小时。村子不大，两小时逛完，适合周末慢悠悠走走；部分石板路陡，穿防滑鞋，垃圾记得带走。'
      }
    ],

    /* ---------- 美食示例评价（内置示范文案，不计入评分） ---------- */
    'changwang-mian': [
      {
        username: '贵阳土著',
        rating: 5,
        updatedAt: '2026-08-14',
        content: '从小吃到大的早餐，红油看着辣其实香，脆哨一定要加，配一碗清汤解腻。早上七点前去不用排队，过了八点半队能排到街角。'
      },
      {
        username: '辣妹子',
        rating: 4,
        updatedAt: '2026-03-22',
        content: '第一次吃有点被大肠劝退，结果越嚼越香，碱水面很筋道。不吃辣的话让老板少放红油，15 块一碗管饱。'
      }
    ],
    'si-wawa': [
      {
        username: '青菜控',
        rating: 5,
        updatedAt: '2026-07-30',
        content: '十几种配菜自己包，薄饼半透明的，蘸酸汤太开胃了，一不留神吃了二十个。适合夏天，清爽不腻。'
      },
      {
        username: '慢吞吞',
        rating: 4,
        updatedAt: '2025-10-05',
        content: '配菜新鲜是关键，折耳根和酸萝卜必加。20 块一份在景区略贵，市区小店更划算。'
      }
    ],
    'guiyang-suan-tang-yu': [
      {
        username: '酸汤爱好者',
        rating: 5,
        updatedAt: '2026-09-01',
        content: '红酸汤发酵得正好，酸辣回甘，江团鱼片现片现煮，嫩得夹不起来。先喝汤再吃鱼，最后下点米粉，完美。'
      },
      {
        username: '怕辣星人',
        rating: 4,
        updatedAt: '2026-02-14',
        content: '本来怕酸，结果白酸汤很温和，鱼肉没土腥味。人均 70 左右，适合两三个人吃。'
      }
    ],
    'zunyi-yang-rou-fen': [
      {
        username: '粉面脑袋',
        rating: 5,
        updatedAt: '2026-08-20',
        content: '汤清但味厚，羊油辣椒是灵魂，撒上芜荽香迷糊了。羊肉给得实在，18 块一碗性价比很高。'
      },
      {
        username: '路过遵义',
        rating: 4,
        updatedAt: '2025-12-18',
        content: '早上来一碗浑身暖和，汤可以免费加。不吃芫荽记得提前说，默认会撒。'
      }
    ],
    'zunyi-luo-guo': [
      {
        username: '夜宵党',
        rating: 5,
        updatedAt: '2026-07-15',
        content: '围着圆铁锅自己烙，五花肉出油后烙土豆和茄子特别香，蘸干辣椒面停不下来。人均 40 能吃撑。'
      },
      {
        username: '慢慢烤',
        rating: 4,
        updatedAt: '2026-04-09',
        content: '烙锅要耐心，火大容易糊。臭豆腐和小豆腐必点，配冰粉解辣。'
      }
    ],
    'anshun-guo-juan': [
      {
        username: '卷卷爱好者',
        rating: 5,
        updatedAt: '2026-08-05',
        content: '米皮 Q 弹，裹满豆芽海带萝卜丝，刷的辣椒水又香又辣，一口一个停不下来。10 块钱管饱。'
      },
      {
        username: '小吃货',
        rating: 4,
        updatedAt: '2025-09-20',
        content: '要现裹的才好吃，放久了米皮会软。不能吃辣让老板少刷辣椒水。'
      }
    ],
    'hua-jiang-gou-rou': [
      {
        username: '肉食动物',
        rating: 5,
        updatedAt: '2026-06-28',
        content: '干锅做法，薄荷和花椒把腥味压得很好，肉质紧实入味。不吃狗肉的朋友可以略过，但贵州本地人很爱。'
      },
      {
        username: '老饕',
        rating: 4,
        updatedAt: '2026-01-15',
        content: '花江镇的老店最正宗，蘸糊辣椒面更香。人均 50，记得配一碗米饭。'
      }
    ],
    'shui-cheng-luo-guo': [
      {
        username: '六盘水常客',
        rating: 5,
        updatedAt: '2026-07-22',
        content: '和遵义烙锅风味不同，水城的偏麻辣，臭豆腐是灵魂，烙到焦香蘸辣椒面。夏天吃也不觉得燥热。'
      },
      {
        username: '毕业旅行',
        rating: 4,
        updatedAt: '2025-08-10',
        content: '人均 35 吃到撑，土豆片一定要点。店家会帮忙控制火候，新手也不怕糊。'
      }
    ],
    'pan-xian-huo-tui': [
      {
        username: '火腿控',
        rating: 5,
        updatedAt: '2026-09-10',
        content: '风干三年的火腿，切薄片油花漂亮，蒸饭时放几片满屋香。80 块一斤略贵但值得，适合当伴手礼。'
      },
      {
        username: '煲汤达人',
        rating: 4,
        updatedAt: '2026-03-05',
        content: '切薄片蒸或者煮火腿饭都好，盐味够不用额外加。买真空包装的方便带。'
      }
    ],
    'bijie-tang-yuan': [
      {
        username: '甜党',
        rating: 5,
        updatedAt: '2026-08-18',
        content: '比普通汤圆大一圈，馅足皮糯，红糖姜茶的汤底暖胃。洗沙和玫瑰馅都好吃，10 块一碗。'
      },
      {
        username: '路过毕节',
        rating: 4,
        updatedAt: '2025-11-22',
        content: '姜味比较重，不爱姜的可能不习惯。现煮的要等几分钟。'
      }
    ],
    'jin-sha-yang-rou-fen': [
      {
        username: '粉面脑袋',
        rating: 5,
        updatedAt: '2026-08-25',
        content: '沙土镇的老店，羊汤香浓不膻，配泡萝卜解腻一绝。和遵义羊肉粉风格不同，这个更醇厚。'
      },
      {
        username: '出差路过',
        rating: 4,
        updatedAt: '2026-04-12',
        content: '18 块一碗，羊肉给得大方。早上人多，拼桌是常态。'
      }
    ],
    'tongren-guo-ba-fen': [
      {
        username: '铜仁女婿',
        rating: 5,
        updatedAt: '2026-07-08',
        content: '米浆烙的薄皮有焦香锅巴味，切丝煮粉口感独特，汤鲜。铜仁早餐的代表，12 块一碗。'
      },
      {
        username: '好奇宝宝',
        rating: 4,
        updatedAt: '2026-02-20',
        content: '锅巴味是亮点，比普通米粉多一层焦香。配油条吃更饱。'
      }
    ],
    'xingyi-ji-rou-tang-yuan': [
      {
        username: '咸汤圆党',
        rating: 5,
        updatedAt: '2026-08-30',
        content: '第一次吃咸口汤圆很惊艳，鸡肉馅扎实，胡椒鸡汤鲜掉眉毛。10 块一碗，兴义独一份。'
      },
      {
        username: '打卡游客',
        rating: 4,
        updatedAt: '2025-10-15',
        content: '皮薄馅大，汤是咸鲜口，吃不惯甜汤圆的人会喜欢。老城的老店最地道。'
      }
    ],
    'kaili-suan-tang-yu': [
      {
        username: '酸汤天花板',
        rating: 5,
        updatedAt: '2026-09-05',
        content: '贵州酸汤鱼的发源地，野生番茄发酵的红酸汤颜色红亮，鱼片现片现煮，嫩而不腥。一定要先喝三碗汤。'
      },
      {
        username: '苗寨游客',
        rating: 4,
        updatedAt: '2026-05-18',
        content: '人均 70，推荐江团。酸汤泡饭一绝，吃完鱼肉加份米粉，饱到走不动。'
      }
    ],
    'miao-jia-la-rou': [
      {
        username: '年货采购',
        rating: 5,
        updatedAt: '2026-01-20',
        content: '柏枝烟熏的，肥肉透明不腻，蒸好后一片下去满嘴香。60 块一斤，过年带两条回去很受欢迎。'
      },
      {
        username: '厨艺新手',
        rating: 4,
        updatedAt: '2025-12-05',
        content: '炒之前先煮一下去盐，配蒜薹或蕨菜炒最香。注意别炒太咸。'
      }
    ],
    'duyun-chong-chong-gao': [
      {
        username: '童年回忆',
        rating: 5,
        updatedAt: '2026-08-22',
        content: '蒸出来的小糕软糯，内馅有糖和洗沙，3 块一个趁热吃。都匀街头的老式味道，越来越少见了。'
      },
      {
        username: '甜食控',
        rating: 4,
        updatedAt: '2026-03-15',
        content: '个头小巧，一口一个，米香浓郁。凉了会变硬，记得趁热。'
      }
    ],
    'libo-suan-sun-yu': [
      {
        username: '荔波吃货',
        rating: 5,
        updatedAt: '2026-07-12',
        content: '酸笋发酵味独特，喜欢的人上头，河鱼鲜嫩。配米饭吃酸辣开胃，人均 65。'
      },
      {
        username: '尝鲜游客',
        rating: 4,
        updatedAt: '2025-08-28',
        content: '酸笋味比酸菜鱼重，第一次吃可能要适应。鱼肉很嫩，建议点中辣。'
      }
    ]
  };
})(window);
