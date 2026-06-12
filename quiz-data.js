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
  }
];
