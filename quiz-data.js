window.NIKKAN_QUIZ_SETS = [
  {
    id: "2026-06-12-manufacturing-ai-watercooling-cnc",
    date: "2026-06-12",
    title: "日刊工業 ものづくり復習 3問",
    shortTitle: "現場AI・水冷・CNC",
    sourceLabel: "日刊工業新聞 復習",
    heroImage: "./assets/q3-cnc-armroid.png",
    heroAlt: "CNC工作機械の中でロボットアームが材料を扱う自動化セル",
    summary: [
      "勘を、測れるデータにする。",
      "水冷は、冷却・漏れ・省エネを見る。",
      "CNC画面から、ロボットを扱いやすくする。"
    ],
    questions: [
      {
        id: "genba-data",
        tag: "AIと現場力",
        question: "AIに現場力を教える時、最初に必要なのは？",
        hint: "形式知化（けいしきちか：人に伝えられる形にすること）の核心。",
        choices: [
          "ベテランの勘を、そのままAIへ入れる",
          "音・温度・振動・画像など、測れるデータに変える",
          "文章だけを大量に読ませる"
        ],
        correctIndex: 1,
        answerTitle: "答え：測れるデータに変える",
        answerParagraphs: [
          "AIは「なんとなく変」を直接読めない。",
          "だから、違和感をセンサー値（数字で測れる情報）に変える。"
        ],
        image: "./assets/q1-genba-data.png",
        imageAlt: "作業者の違和感をセンサーと画面のデータへ変えている工場",
        caption: "見る場所：人の勘 → センサー → 画面のデータ。ここがAIに渡せる形。"
      },
      {
        id: "watercooling-server",
        tag: "水冷サーバー",
        question: "DC水冷サーバー検証で一番見たいことは？",
        hint: "DC（データセンター：サーバーを大量に置く施設）の話。",
        choices: [
          "水の色がきれいか",
          "サーバー名が覚えやすいか",
          "冷えるか、漏れないか、省エネになるか"
        ],
        correctIndex: 2,
        answerTitle: "答え：冷却・漏れ・省エネ",
        answerParagraphs: [
          "AIサーバーはCPU/GPU（計算する部品）が熱くなる。",
          "水冷は強いが、水を使うので漏れ確認も重要。"
        ],
        image: "./assets/q2-watercooling-server.png",
        imageAlt: "液冷チューブ付きAIサーバーを検証する技術者",
        caption: "見る場所：青赤の配管、流量計、点検する人。冷却と安全確認がセット。"
      },
      {
        id: "cnc-armroid",
        tag: "CNCとARMROID",
        question: "ティーチングレスCNCとARMROIDが狙う「使いやすさ」は？",
        hint: "ティーチング（ロボットに動きを教える作業）を減らす話。",
        choices: [
          "ロボット専門家でなくても、工作機械の画面から扱いやすくする",
          "ロボットを速く動かすだけにする",
          "人が毎回材料を入れる前提に戻す"
        ],
        correctIndex: 0,
        answerTitle: "答え：工作機械の人が扱える自動化",
        answerParagraphs: [
          "CNC（数字で機械を動かす制御）に、ロボット操作を近づける。",
          "ARMROIDは、工作機械とロボットを一体で使う発想。"
        ],
        image: "./assets/q3-cnc-armroid.png",
        imageAlt: "CNC工作機械内のロボットアームがワークを扱う場面",
        caption: "見る場所：左の材料、中央のロボット、右の操作盤。人が機械画面から自動化を扱う。"
      }
    ]
  },
  {
    id: "2026-06-15-mythos-ai-infrastructure-security",
    date: "2026-06-15",
    title: "日刊工業 ミュトス級AIに警戒 3問",
    shortTitle: "ミュトス級AI・正規メール・重要インフラ",
    sourceLabel: "日刊工業新聞 2026/6/15 復習",
    heroImage: "./assets/2026-06-15-q2-infrastructure-ot.png",
    heroAlt: "AI悪用による攻撃が重要インフラの制御室へ広がるイメージ",
    summary: [
      "怖いのは、偽物が正規ルートに見えること。",
      "重要インフラは、電力・水道・医療・通信など社会の土台。",
      "セキュアは、暗号化だけでなく本人確認と監視まで含む。"
    ],
    questions: [
      {
        id: "legitimate-system-phishing",
        tag: "正規メールの怖さ",
        question: "ミュトス級AIを悪用した時、一番怖いメール攻撃はどれ？",
        hint: "正規（せいき：本物・正式なもの）に見えることが核心。",
        choices: [
          "知らない個人メールから、変な日本語の迷惑メールが来る",
          "本物の会社・取引先に見えるメールで、送金や情報入力を信じさせる",
          "メールの色やデザインだけを派手にする"
        ],
        correctIndex: 1,
        answerTitle: "答え：本物に見える正規ルートの攻撃",
        answerParagraphs: [
          "人は「知っている会社から来た」と思うと警戒が下がる。",
          "AIで文面が自然になると、偽物メールでも本物っぽく見える。",
          "だから送金、ID入力、添付ファイル開封が危なくなる。"
        ],
        image: "./assets/2026-06-15-q1-legitimate-phishing.png",
        imageAlt: "正規メールに見えるフィッシングで送金被害が起きるイメージ",
        caption: "見る場所：左の正規システムっぽい入口、中央のメール、右の金銭被害。怖いのは「本物に見える道」。"
      },
      {
        id: "important-infrastructure-ot",
        tag: "重要インフラとOT",
        question: "重要インフラへの攻撃で、なぜ制御・運用技術（OT）が問題になる？",
        hint: "OT（設備を動かす制御技術）は、画面の中だけでなく現実の機械を動かす。",
        choices: [
          "会社のホームページの色が変わるだけだから",
          "電力・水道・医療・工場など、現実の設備停止につながるから",
          "パソコンの壁紙が消えるだけだから"
        ],
        correctIndex: 1,
        answerTitle: "答え：現実の設備に影響が出るから",
        answerParagraphs: [
          "IT（情報システム）は主にデータを扱う。",
          "OTはポンプ、電力設備、工場ラインなどを動かす。",
          "攻撃がOTまで届くと、社会の土台が止まる可能性がある。"
        ],
        image: "./assets/2026-06-15-q2-infrastructure-ot.png",
        imageAlt: "サイバー攻撃が重要インフラとOT制御室に広がるイメージ",
        caption: "見る場所：赤い侵入ルートが、事務所から制御室、電力・水道・医療・工場へ伸びるところ。"
      },
      {
        id: "supplychain-vpn-secure",
        tag: "サプライチェーンとVPN",
        question: "セキュアな仮想専用線（VPN）で大事なのはどれ？",
        hint: "VPN（ネット上に作る安全な通路）だけではなく、誰が使うかの確認も大事。",
        choices: [
          "青い線でつながっていれば、それだけで完全に安全",
          "暗号化、本人確認、アクセス制限、監視を組み合わせる",
          "取引先なら、確認なしで全部つなげる"
        ],
        correctIndex: 1,
        answerTitle: "答え：暗号化＋本人確認＋監視",
        answerParagraphs: [
          "サプライチェーン（取引先やサービスのつながり）は便利だが、入口も増える。",
          "VPNは通信を守る道だが、悪い人が正しい鍵を持つと通れてしまう。",
          "だからセキュアとは、通路・本人確認・監視をセットで守ること。"
        ],
        image: "./assets/2026-06-15-q3-supplychain-vpn-secure.png",
        imageAlt: "サプライチェーンの弱い接続と安全なVPN接続を比べるイメージ",
        caption: "見る場所：赤い弱い取引先ルートと、青い安全なトンネル。安全は『線』だけでなく『確認』と『監視』まで。"
      }
    ]
  }
];
