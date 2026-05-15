export interface Consulate {
  id: string;
  type: string;
  city_ja: string;
  city_en: string;
  name_ja: string;
  name_en: string;
  url: string;
  note?: string;
}

export interface ConsulateCountry {
  country_ja: string;
  country_en: string;
  consulates: Consulate[];
}

export interface ConsulateRegion {
  id: string;
  label_ja: string;
  label_en: string;
  countries: ConsulateCountry[];
}

export const CONSULATE_REGIONS: ConsulateRegion[] = [
  {
    id: "east-asia",
    label_ja: "東アジア",
    label_en: "East Asia",
    countries: [
      {
        country_ja: "日本", country_en: "Japan",
        consulates: [
          { id: "jp-osaka",   type: "総領事館", city_ja: "大阪",  city_en: "Osaka",  name_ja: "在大阪タイ王国総領事館",  name_en: "Royal Thai Consulate-General, Osaka",  url: "https://osaka.thaiembassy.org" },
          { id: "jp-tokyo",   type: "大使館",   city_ja: "東京",  city_en: "Tokyo",  name_ja: "在東京タイ王国大使館",     name_en: "Royal Thai Embassy, Tokyo",           url: "http://www.thaiembassy.jp" },
          { id: "jp-fukuoka", type: "総領事館", city_ja: "福岡",  city_en: "Fukuoka",name_ja: "在福岡タイ王国総領事館",  name_en: "Royal Thai Consulate-General, Fukuoka", url: "https://fukuoka.thaiembassy.org" },
        ],
      },
      {
        country_ja: "台湾", country_en: "Taiwan",
        consulates: [
          { id: "tw-taipei", type: "通商経済事務所", city_ja: "台北", city_en: "Taipei", name_ja: "タイ通商経済事務所（台北）", name_en: "Thailand Trade and Economic Office (Taipei)", url: "https://tteo.thaiembassy.org", note: "通常の大使館・総領事館ではありませんが、公式サイトにDTV案内が掲載されています。" },
        ],
      },
      {
        country_ja: "韓国", country_en: "Republic of Korea",
        consulates: [
          { id: "kr-seoul", type: "大使館", city_ja: "ソウル", city_en: "Seoul", name_ja: "在ソウルタイ王国大使館", name_en: "Royal Thai Embassy, Seoul", url: "https://seoul.thaiembassy.org" },
        ],
      },
      {
        country_ja: "中国", country_en: "China",
        consulates: [
          { id: "cn-shanghai", type: "総領事館", city_ja: "上海",  city_en: "Shanghai",  name_ja: "在上海タイ王国総領事館",  name_en: "Royal Thai Consulate-General, Shanghai",  url: "https://thaishanghai.thaiembassy.org" },
          { id: "cn-beijing",  type: "大使館",   city_ja: "北京",  city_en: "Beijing",   name_ja: "在北京タイ王国大使館",   name_en: "Royal Thai Embassy, Beijing",             url: "https://thaiembbeij.org/th" },
          { id: "cn-nanning",  type: "総領事館", city_ja: "南寧",  city_en: "Nanning",   name_ja: "在南寧タイ王国総領事館",  name_en: "Royal Thai Consulate-General, Nanning",   url: "https://nanning.thaiembassy.org" },
          { id: "cn-xiamen",   type: "総領事館", city_ja: "厦門",  city_en: "Xiamen",    name_ja: "在厦門タイ王国総領事館",  name_en: "Royal Thai Consulate-General, Xiamen",    url: "https://xiamen.thaiembassy.org" },
          { id: "cn-guangzhou",type: "総領事館", city_ja: "広州",  city_en: "Guangzhou", name_ja: "在広州タイ王国総領事館",  name_en: "Royal Thai Consulate-General, Guangzhou", url: "https://guangzhou.thaiembassy.org" },
          { id: "cn-chengdu",  type: "総領事館", city_ja: "成都",  city_en: "Chengdu",   name_ja: "在成都タイ王国総領事館",  name_en: "Royal Thai Consulate-General, Chengdu",   url: "https://chengdu.thaiembassy.org" },
          { id: "cn-kunming",  type: "総領事館", city_ja: "昆明",  city_en: "Kunming",   name_ja: "在昆明タイ王国総領事館",  name_en: "Royal Thai Consulate-General, Kunming",   url: "https://kunming.thaiembassy.org" },
          { id: "cn-xian",     type: "総領事館", city_ja: "西安",  city_en: "Xian",      name_ja: "在西安タイ王国総領事館",  name_en: "Royal Thai Consulate-General, Xian",      url: "https://xian.thaiembassy.org" },
          { id: "cn-qingdao",  type: "総領事館", city_ja: "青島",  city_en: "Qingdao",   name_ja: "在青島タイ王国総領事館",  name_en: "Royal Thai Consulate-General, Qingdao",   url: "https://qingdao.thaiembassy.org" },
          { id: "cn-hongkong", type: "総領事館", city_ja: "香港",  city_en: "Hong Kong", name_ja: "在香港タイ王国総領事館",  name_en: "Royal Thai Consulate-General, Hong Kong", url: "https://hongkong.thaiembassy.org" },
        ],
      },
    ],
  },
  {
    id: "southeast-asia",
    label_ja: "東南アジア",
    label_en: "Southeast Asia",
    countries: [
      {
        country_ja: "ベトナム", country_en: "Vietnam",
        consulates: [
          { id: "vn-hanoi",   type: "大使館",   city_ja: "ハノイ",     city_en: "Hanoi",        name_ja: "在ハノイタイ王国大使館",           name_en: "Royal Thai Embassy, Hanoi",                   url: "https://rtehanoi.thaiembassy.org" },
          { id: "vn-hcm",     type: "総領事館", city_ja: "ホーチミン", city_en: "Ho Chi Minh",  name_ja: "在ホーチミンタイ王国総領事館",     name_en: "Royal Thai Consulate-General, Ho Chi Minh",   url: "https://hochiminh.thaiembassy.org" },
        ],
      },
      {
        country_ja: "ラオス", country_en: "Laos",
        consulates: [
          { id: "la-savannakhet", type: "総領事館", city_ja: "サワンナケート", city_en: "Savannakhet", name_ja: "在サワンナケートタイ王国総領事館", name_en: "Royal Thai Consulate-General, Savannakhet", url: "https://savannakhet.thaiembassy.org" },
          { id: "la-vientiane",   type: "大使館",   city_ja: "ビエンチャン",   city_en: "Vientiane",   name_ja: "在ビエンチャンタイ王国大使館",     name_en: "Royal Thai Embassy, Vientiane",             url: "https://vientiane.thaiembassy.org" },
        ],
      },
      {
        country_ja: "カンボジア", country_en: "Cambodia",
        consulates: [
          { id: "kh-siemreap",  type: "総領事館", city_ja: "シェムリアップ", city_en: "Siem Reap",   name_ja: "在シェムリアップタイ王国総領事館", name_en: "Royal Thai Consulate-General, Siem Reap", url: "https://siemreap.thaiembassy.org" },
          { id: "kh-phnompenh", type: "大使館",   city_ja: "プノンペン",     city_en: "Phnom Penh",  name_ja: "在プノンペンタイ王国大使館",       name_en: "Royal Thai Embassy, Phnom Penh",          url: "https://phnompenh.thaiembassy.org/" },
        ],
      },
      {
        country_ja: "マレーシア", country_en: "Malaysia",
        consulates: [
          { id: "my-kl",         type: "大使館",   city_ja: "クアラルンプール", city_en: "Kuala Lumpur", name_ja: "在クアラルンプールタイ王国大使館", name_en: "Royal Thai Embassy, Kuala Lumpur",          url: "https://kualalumpur.thaiembassy.org" },
          { id: "my-kotabharu",  type: "総領事館", city_ja: "コタバル",         city_en: "Kota Bharu",   name_ja: "在コタバルタイ王国総領事館",       name_en: "Royal Thai Consulate-General, Kota Bharu", url: "https://kotabharu.thaiembassy.org" },
          { id: "my-penang",     type: "総領事館", city_ja: "ペナン",           city_en: "Penang",        name_ja: "在ペナンタイ王国総領事館",         name_en: "Royal Thai Consulate-General, Penang",     url: "https://penang.thaiembassy.org" },
        ],
      },
      {
        country_ja: "シンガポール", country_en: "Singapore",
        consulates: [
          { id: "sg-singapore", type: "大使館", city_ja: "シンガポール", city_en: "Singapore", name_ja: "在シンガポールタイ王国大使館", name_en: "Royal Thai Embassy, Singapore", url: "https://singapore.thaiembassy.org" },
        ],
      },
      {
        country_ja: "インドネシア", country_en: "Indonesia",
        consulates: [
          { id: "id-jakarta", type: "大使館", city_ja: "ジャカルタ", city_en: "Jakarta", name_ja: "在ジャカルタタイ王国大使館", name_en: "Royal Thai Embassy, Jakarta", url: "http://www.thaiembassyjakarta.com" },
        ],
      },
      {
        country_ja: "フィリピン", country_en: "Philippines",
        consulates: [
          { id: "ph-manila", type: "大使館", city_ja: "マニラ", city_en: "Manila", name_ja: "在マニラタイ王国大使館", name_en: "Royal Thai Embassy, Manila", url: "https://www.thaiembassymnl.ph/" },
        ],
      },
      {
        country_ja: "ミャンマー", country_en: "Myanmar",
        consulates: [
          { id: "mm-yangon", type: "大使館", city_ja: "ヤンゴン", city_en: "Yangon", name_ja: "在ヤンゴンタイ王国大使館", name_en: "Royal Thai Embassy, Yangon", url: "https://yangon.thaiembassy.org" },
        ],
      },
      {
        country_ja: "ブルネイ", country_en: "Brunei",
        consulates: [
          { id: "bn-bsb", type: "大使館", city_ja: "バンダルスリブガワン", city_en: "Bandar Seri Begawan", name_ja: "在バンダルスリブガワンタイ王国大使館", name_en: "Royal Thai Embassy, Bandar Seri Begawan", url: "https://bsb.thaiembassy.org" },
        ],
      },
      {
        country_ja: "東ティモール", country_en: "Timor-Leste",
        consulates: [
          { id: "tl-dili", type: "大使館", city_ja: "ディリ", city_en: "Dili", name_ja: "在ディリタイ王国大使館", name_en: "Royal Thai Embassy, Dili", url: "https://dili.thaiembassy.org" },
        ],
      },
    ],
  },
  {
    id: "south-asia",
    label_ja: "南アジア",
    label_en: "South Asia",
    countries: [
      {
        country_ja: "インド", country_en: "India",
        consulates: [
          { id: "in-kolkata",   type: "総領事館", city_ja: "コルカタ",     city_en: "Kolkata",    name_ja: "在コルカタタイ王国総領事館",   name_en: "Royal Thai Consulate-General, Kolkata",  url: "https://kolkata.thaiembassy.org" },
          { id: "in-chennai",   type: "総領事館", city_ja: "チェンナイ",   city_en: "Chennai",    name_ja: "在チェンナイタイ王国総領事館",  name_en: "Royal Thai Consulate-General, Chennai",  url: "https://chennai.thaiembassy.org" },
          { id: "in-newdelhi",  type: "大使館",   city_ja: "ニューデリー", city_en: "New Delhi",  name_ja: "在ニューデリータイ王国大使館",  name_en: "Royal Thai Embassy, New Delhi",           url: "https://newdelhi.thaiembassy.org" },
          { id: "in-mumbai",    type: "総領事館", city_ja: "ムンバイ",     city_en: "Mumbai",     name_ja: "在ムンバイタイ王国総領事館",    name_en: "Royal Thai Consulate-General, Mumbai",   url: "https://mumbai.thaiembassy.org" },
        ],
      },
      {
        country_ja: "スリランカ", country_en: "Sri Lanka",
        consulates: [
          { id: "lk-colombo", type: "大使館", city_ja: "コロンボ", city_en: "Colombo", name_ja: "在コロンボタイ王国大使館", name_en: "Royal Thai Embassy, Colombo", url: "https://colombo.thaiembassy.org" },
        ],
      },
      {
        country_ja: "ネパール", country_en: "Nepal",
        consulates: [
          { id: "np-kathmandu", type: "大使館", city_ja: "カトマンズ", city_en: "Kathmandu", name_ja: "在カトマンズタイ王国大使館", name_en: "Royal Thai Embassy, Kathmandu", url: "https://kathmandu.thaiembassy.org" },
        ],
      },
      {
        country_ja: "バングラデシュ", country_en: "Bangladesh",
        consulates: [
          { id: "bd-dhaka", type: "大使館", city_ja: "ダッカ", city_en: "Dhaka", name_ja: "在ダッカタイ王国大使館", name_en: "Royal Thai Embassy, Dhaka", url: "https://dhaka.thaiembassy.org" },
        ],
      },
      {
        country_ja: "パキスタン", country_en: "Pakistan",
        consulates: [
          { id: "pk-islamabad", type: "大使館",   city_ja: "イスラマバード", city_en: "Islamabad", name_ja: "在イスラマバードタイ王国大使館", name_en: "Royal Thai Embassy, Islamabad",           url: "https://islamabad.thaiembassy.org" },
          { id: "pk-karachi",   type: "総領事館", city_ja: "カラチ",         city_en: "Karachi",   name_ja: "在カラチタイ王国総領事館",       name_en: "Royal Thai Consulate-General, Karachi",  url: "https://karachi.thaiembassy.org" },
        ],
      },
    ],
  },
  {
    id: "middle-east",
    label_ja: "中東",
    label_en: "Middle East",
    countries: [
      {
        country_ja: "アラブ首長国連邦", country_en: "United Arab Emirates",
        consulates: [
          { id: "ae-abudhabi", type: "大使館",   city_ja: "Abu Dhabi", city_en: "Abu Dhabi", name_ja: "在Abu Dhabiタイ王国大使館",     name_en: "Royal Thai Embassy, Abu Dhabi",           url: "https://abudhabi.thaiembassy.org" },
          { id: "ae-dubai",    type: "総領事館", city_ja: "ドバイ",    city_en: "Dubai",     name_ja: "在ドバイタイ王国総領事館",      name_en: "Royal Thai Consulate-General, Dubai",     url: "https://dubai.thaiembassy.org" },
        ],
      },
      {
        country_ja: "サウジアラビア", country_en: "Saudi Arabia",
        consulates: [
          { id: "sa-jeddah", type: "総領事館", city_ja: "ジェッダ", city_en: "Jeddah", name_ja: "在ジェッダタイ王国総領事館",  name_en: "Royal Thai Consulate-General, Jeddah", url: "https://jeddah.thaiembassy.org" },
          { id: "sa-riyadh", type: "大使館",   city_ja: "リヤド",   city_en: "Riyadh", name_ja: "在リヤドタイ王国大使館",      name_en: "Royal Thai Embassy, Riyadh",           url: "https://riyadh.thaiembassy.org" },
        ],
      },
      {
        country_ja: "カタール", country_en: "Qatar",
        consulates: [
          { id: "qa-doha", type: "大使館", city_ja: "ドーハ", city_en: "Doha", name_ja: "在ドーハタイ王国大使館", name_en: "Royal Thai Embassy, Doha", url: "https://doha.thaiembassy.org" },
        ],
      },
      {
        country_ja: "クウェート", country_en: "Kuwait",
        consulates: [
          { id: "kw-kuwait", type: "大使館", city_ja: "クウェート市", city_en: "Kuwait", name_ja: "在クウェート市タイ王国大使館", name_en: "Royal Thai Embassy, Kuwait", url: "https://kuwait.thaiembassy.org" },
        ],
      },
      {
        country_ja: "バーレーン", country_en: "Bahrain",
        consulates: [
          { id: "bh-manama", type: "大使館", city_ja: "マナーマ", city_en: "Manama", name_ja: "在マナーマタイ王国大使館", name_en: "Royal Thai Embassy, Manama", url: "https://manama.thaiembassy.org" },
        ],
      },
      {
        country_ja: "オマーン", country_en: "Oman",
        consulates: [
          { id: "om-muscat", type: "大使館", city_ja: "マスカット", city_en: "Muscat", name_ja: "在マスカットタイ王国大使館", name_en: "Royal Thai Embassy, Muscat", url: "https://muscat.thaiembassy.org" },
        ],
      },
      {
        country_ja: "イスラエル", country_en: "Israel",
        consulates: [
          { id: "il-telaviv", type: "大使館", city_ja: "テルアビブ", city_en: "Tel Aviv", name_ja: "在テルアビブタイ王国大使館", name_en: "Royal Thai Embassy, Tel Aviv", url: "https://telaviv.thaiembassy.org" },
        ],
      },
      {
        country_ja: "イラン", country_en: "Iran",
        consulates: [
          { id: "ir-tehran", type: "大使館", city_ja: "テヘラン", city_en: "Tehran", name_ja: "在テヘランタイ王国大使館", name_en: "Royal Thai Embassy, Tehran", url: "https://tehran.thaiembassy.org" },
        ],
      },
      {
        country_ja: "ヨルダン", country_en: "Jordan",
        consulates: [
          { id: "jo-amman", type: "大使館", city_ja: "アンマン", city_en: "Amman", name_ja: "在アンマンタイ王国大使館", name_en: "Royal Thai Embassy, Amman", url: "https://amman.thaiembassy.org" },
        ],
      },
    ],
  },
  {
    id: "europe",
    label_ja: "ヨーロッパ",
    label_en: "Europe",
    countries: [
      { country_ja: "イギリス",     country_en: "United Kingdom",  consulates: [{ id: "gb-london",    type: "大使館",   city_ja: "ロンドン",       city_en: "London",     name_ja: "在ロンドンタイ王国大使館",       name_en: "Royal Thai Embassy, London",     url: "https://london.thaiembassy.org" }] },
      { country_ja: "フランス",     country_en: "France",          consulates: [{ id: "fr-paris",     type: "大使館",   city_ja: "パリ",           city_en: "Paris",      name_ja: "在パリタイ王国大使館",           name_en: "Royal Thai Embassy, Paris",      url: "https://www.thaiembassy.fr/" }] },
      {
        country_ja: "ドイツ", country_en: "Germany",
        consulates: [
          { id: "de-berlin",    type: "大使館",   city_ja: "ベルリン",       city_en: "Berlin",     name_ja: "在ベルリンタイ王国大使館",       name_en: "Royal Thai Embassy, Berlin",             url: "https://berlin.thaiembassy.org" },
          { id: "de-frankfurt", type: "総領事館", city_ja: "フランクフルト", city_en: "Frankfurt",  name_ja: "在フランクフルトタイ王国総領事館", name_en: "Royal Thai Consulate-General, Frankfurt", url: "https://frankfurt.thaiembassy.org" },
          { id: "de-munich",    type: "総領事館", city_ja: "ミュンヘン",     city_en: "Munich",     name_ja: "在ミュンヘンタイ王国総領事館",   name_en: "Royal Thai Consulate-General, Munich",   url: "https://munich.thaiembassy.org" },
        ],
      },
      { country_ja: "イタリア",     country_en: "Italy",           consulates: [{ id: "it-rome",      type: "大使館",   city_ja: "ローマ",         city_en: "Rome",       name_ja: "在ローマタイ王国大使館",         name_en: "Royal Thai Embassy, Rome",       url: "https://rome.thaiembassy.org/" }] },
      { country_ja: "スペイン",     country_en: "Spain",           consulates: [{ id: "es-madrid",    type: "大使館",   city_ja: "マドリード",     city_en: "Madrid",     name_ja: "在マドリードタイ王国大使館",     name_en: "Royal Thai Embassy, Madrid",     url: "https://madrid.thaiembassy.org" }] },
      { country_ja: "ポルトガル",   country_en: "Portugal",        consulates: [{ id: "pt-lisbon",    type: "大使館",   city_ja: "リスボン",       city_en: "Lisbon",     name_ja: "在リスボンタイ王国大使館",       name_en: "Royal Thai Embassy, Lisbon",     url: "https://lisbon.thaiembassy.org" }] },
      { country_ja: "オランダ",     country_en: "Netherlands",     consulates: [{ id: "nl-hague",     type: "大使館",   city_ja: "ハーグ",         city_en: "The Hague",  name_ja: "在ハーグタイ王国大使館",         name_en: "Royal Thai Embassy, The Hague",  url: "https://hague.thaiembassy.org/" }] },
      { country_ja: "ベルギー",     country_en: "Belgium",         consulates: [{ id: "be-brussels",  type: "大使館",   city_ja: "ブリュッセル",   city_en: "Brussels",   name_ja: "在ブリュッセルタイ王国大使館",   name_en: "Royal Thai Embassy, Brussels",   url: "https://brussels.thaiembassy.org" }] },
      { country_ja: "スイス",       country_en: "Switzerland",     consulates: [{ id: "ch-bern",      type: "大使館",   city_ja: "ベルン",         city_en: "Bern",       name_ja: "在ベルンタイ王国大使館",         name_en: "Royal Thai Embassy, Bern",       url: "https://www.thaiembassy.ch/" }] },
      { country_ja: "オーストリア", country_en: "Austria",         consulates: [{ id: "at-vienna",    type: "大使館",   city_ja: "ウィーン",       city_en: "Vienna",     name_ja: "在ウィーンタイ王国大使館",       name_en: "Royal Thai Embassy, Vienna",     url: "http://thaiembassy.at" }] },
      { country_ja: "スウェーデン", country_en: "Sweden",          consulates: [{ id: "se-stockholm", type: "大使館",   city_ja: "ストックホルム", city_en: "Stockholm",  name_ja: "在ストックホルムタイ王国大使館", name_en: "Royal Thai Embassy, Stockholm",  url: "http://thaiembassy.se/en/home/" }] },
      { country_ja: "デンマーク",   country_en: "Denmark",         consulates: [{ id: "dk-copenhagen",type: "大使館",   city_ja: "コペンハーゲン", city_en: "Copenhagen", name_ja: "在コペンハーゲンタイ王国大使館", name_en: "Royal Thai Embassy, Copenhagen", url: "https://copenhagen.thaiembassy.org" }] },
      { country_ja: "フィンランド", country_en: "Finland",         consulates: [{ id: "fi-helsinki",  type: "大使館",   city_ja: "ヘルシンキ",     city_en: "Helsinki",   name_ja: "在ヘルシンキタイ王国大使館",     name_en: "Royal Thai Embassy, Helsinki",   url: "https://helsinki.thaiembassy.org" }] },
      { country_ja: "ノルウェー",   country_en: "Norway",          consulates: [{ id: "no-oslo",      type: "大使館",   city_ja: "オスロ",         city_en: "Oslo",       name_ja: "在オスロタイ王国大使館",         name_en: "Royal Thai Embassy, Oslo",       url: "https://oslo.thaiembassy.org" }] },
      { country_ja: "ポーランド",   country_en: "Poland",          consulates: [{ id: "pl-warsaw",    type: "大使館",   city_ja: "ワルシャワ",     city_en: "Warsaw",     name_ja: "在ワルシャワタイ王国大使館",     name_en: "Royal Thai Embassy, Warsaw",     url: "https://warsaw.thaiembassy.org" }] },
      { country_ja: "ハンガリー",   country_en: "Hungary",         consulates: [{ id: "hu-budapest",  type: "大使館",   city_ja: "ブダペスト",     city_en: "Budapest",   name_ja: "在ブダペストタイ王国大使館",     name_en: "Royal Thai Embassy, Budapest",   url: "https://budapest.thaiembassy.org" }] },
      { country_ja: "ルーマニア",   country_en: "Romania",         consulates: [{ id: "ro-bucharest", type: "大使館",   city_ja: "ブカレスト",     city_en: "Bucharest",  name_ja: "在ブカレストタイ王国大使館",     name_en: "Royal Thai Embassy, Bucharest",  url: "https://bucharest.thaiembassy.org" }] },
      { country_ja: "チェコ",       country_en: "Czech Republic",  consulates: [{ id: "cz-prague",    type: "大使館",   city_ja: "プラハ",         city_en: "Prague",     name_ja: "在プラハタイ王国大使館",         name_en: "Royal Thai Embassy, Prague",     url: "http://www.thaiembassy.cz/" }] },
      { country_ja: "ギリシャ",     country_en: "Greece",          consulates: [{ id: "gr-athens",    type: "大使館",   city_ja: "アテネ",         city_en: "Athens",     name_ja: "在アテネタイ王国大使館",         name_en: "Royal Thai Embassy, Athens",     url: "https://athens.thaiembassy.org" }] },
      { country_ja: "トルコ",       country_en: "Turkey",          consulates: [{ id: "tr-ankara",    type: "大使館",   city_ja: "アンカラ",       city_en: "Ankara",     name_ja: "在アンカラタイ王国大使館",       name_en: "Royal Thai Embassy, Ankara",     url: "https://ankara.thaiembassy.org" }] },
    ],
  },
  {
    id: "africa",
    label_ja: "アフリカ",
    label_en: "Africa",
    countries: [
      { country_ja: "エジプト",       country_en: "Egypt",        consulates: [{ id: "eg-cairo",    type: "大使館", city_ja: "カイロ",     city_en: "Cairo",    name_ja: "在カイロタイ王国大使館",     name_en: "Royal Thai Embassy, Cairo",    url: "https://cairo.thaiembassy.org" }] },
      { country_ja: "ケニア",         country_en: "Kenya",        consulates: [{ id: "ke-nairobi",  type: "大使館", city_ja: "ナイロビ",   city_en: "Nairobi",  name_ja: "在ナイロビタイ王国大使館",   name_en: "Royal Thai Embassy, Nairobi",  url: "https://nairobi.thaiembassy.org" }] },
      { country_ja: "南アフリカ",     country_en: "South Africa", consulates: [{ id: "za-pretoria", type: "大使館", city_ja: "プレトリア", city_en: "Pretoria", name_ja: "在プレトリアタイ王国大使館", name_en: "Royal Thai Embassy, Pretoria", url: "https://pretoria.thaiembassy.org" }] },
      { country_ja: "モロッコ",       country_en: "Morocco",      consulates: [{ id: "ma-rabat",    type: "大使館", city_ja: "ラバト",     city_en: "Rabat",    name_ja: "在ラバトタイ王国大使館",     name_en: "Royal Thai Embassy, Rabat",    url: "https://rabat.thaiembassy.org" }] },
      { country_ja: "セネガル",       country_en: "Senegal",      consulates: [{ id: "sn-dakar",    type: "大使館", city_ja: "ダカール",   city_en: "Dakar",    name_ja: "在ダカールタイ王国大使館",   name_en: "Royal Thai Embassy, Dakar",    url: "https://dakar.thaiembassy.org" }] },
      { country_ja: "ナイジェリア",   country_en: "Nigeria",      consulates: [{ id: "ng-abuja",    type: "大使館", city_ja: "アブジャ",   city_en: "ABUJA",    name_ja: "在アブジャタイ王国大使館",   name_en: "Royal Thai Embassy, ABUJA",    url: "https://abuja.thaiembassy.org" }] },
      { country_ja: "モザンビーク",   country_en: "Mozambique",   consulates: [{ id: "mz-maputo",   type: "大使館", city_ja: "マプト",     city_en: "Maputo",   name_ja: "在マプトタイ王国大使館",     name_en: "Royal Thai Embassy, Maputo",   url: "https://maputo.thaiembassy.org" }] },
    ],
  },
  {
    id: "americas",
    label_ja: "南北アメリカ",
    label_en: "Americas",
    countries: [
      {
        country_ja: "アメリカ", country_en: "United States of America",
        consulates: [
          { id: "us-chicago",    type: "総領事館", city_ja: "シカゴ",         city_en: "Chicago",       name_ja: "在シカゴタイ王国総領事館",         name_en: "Royal Thai Consulate-General, Chicago",    url: "https://cgchicago.thaiembassy.org/" },
          { id: "us-newyork",    type: "総領事館", city_ja: "ニューヨーク",   city_en: "New York",      name_ja: "在ニューヨークタイ王国総領事館",   name_en: "Royal Thai Consulate-General, New York",   url: "https://newyork.thaiembassy.org" },
          { id: "us-la",         type: "総領事館", city_ja: "ロサンゼルス",   city_en: "Los Angeles",   name_ja: "在ロサンゼルスタイ王国総領事館",   name_en: "Royal Thai Consulate-General, Los Angeles", url: "https://thaiconsulatela.thaiembassy.org" },
          { id: "us-washington", type: "大使館",   city_ja: "ワシントンD.C.", city_en: "Washington",    name_ja: "在ワシントンD.C.タイ王国大使館",   name_en: "Royal Thai Embassy, Washington",           url: "https://washingtondc.thaiembassy.org" },
        ],
      },
      {
        country_ja: "カナダ", country_en: "Canada",
        consulates: [
          { id: "ca-ottawa",    type: "大使館",   city_ja: "オタワ",       city_en: "Ottawa",    name_ja: "在オタワタイ王国大使館",       name_en: "Royal Thai Embassy, Ottawa",              url: "https://ottawa.thaiembassy.org" },
          { id: "ca-vancouver", type: "総領事館", city_ja: "バンクーバー", city_en: "Vancouver", name_ja: "在バンクーバータイ王国総領事館", name_en: "Royal Thai Consulate-General, Vancouver", url: "https://vancouver.thaiembassy.org/" },
        ],
      },
      { country_ja: "ブラジル",   country_en: "Brazil",    consulates: [{ id: "br-brasilia",  type: "大使館", city_ja: "ブラジリア",     city_en: "Brasilia",     name_ja: "在ブラジリアタイ王国大使館",     name_en: "Royal Thai Embassy, Brasilia",     url: "https://brasilia.thaiembassy.org/" }] },
      { country_ja: "アルゼンチン",country_en: "Argentina", consulates: [{ id: "ar-buenosaires",type:"大使館", city_ja: "ブエノスアイレス",city_en:"Buenos Aires",  name_ja: "在ブエノスアイレスタイ王国大使館",name_en: "Royal Thai Embassy, Buenos Aires", url: "https://buenos-aires.thaiembassy.org" }] },
      { country_ja: "チリ",       country_en: "Chile",     consulates: [{ id: "cl-santiago",  type: "大使館", city_ja: "サンティアゴ",   city_en: "Santiago",     name_ja: "在サンティアゴタイ王国大使館",   name_en: "Royal Thai Embassy, Santiago",     url: "https://santiago.thaiembassy.org" }] },
      { country_ja: "ペルー",     country_en: "Peru",      consulates: [{ id: "pe-lima",      type: "大使館", city_ja: "リマ",           city_en: "Lima",         name_ja: "在リマタイ王国大使館",           name_en: "Royal Thai Embassy, Lima",         url: "https://lima.thaiembassy.org" }] },
      { country_ja: "メキシコ",   country_en: "Mexico",    consulates: [{ id: "mx-mexicocity",type: "大使館", city_ja: "メキシコシティ", city_en: "Mexico City",  name_ja: "在メキシコシティタイ王国大使館", name_en: "Royal Thai Embassy, Mexico City",  url: "https://mexico.thaiembassy.org" }] },
    ],
  },
  {
    id: "oceania",
    label_ja: "オセアニア",
    label_en: "Oceania",
    countries: [
      {
        country_ja: "オーストラリア", country_en: "Australia",
        consulates: [
          { id: "au-canberra", type: "大使館",   city_ja: "キャンベラ", city_en: "Canberra", name_ja: "在キャンベラタイ王国大使館",     name_en: "Royal Thai Embassy, Canberra",            url: "https://canberra.thaiembassy.org/" },
          { id: "au-sydney",   type: "総領事館", city_ja: "シドニー",   city_en: "Sydney",   name_ja: "在シドニータイ王国総領事館",     name_en: "Royal Thai Consulate-General, Sydney",    url: "https://sydney.thaiembassy.org" },
        ],
      },
      {
        country_ja: "ニュージーランド", country_en: "New Zealand",
        consulates: [
          { id: "nz-wellington", type: "大使館", city_ja: "ウェリントン", city_en: "Wellington", name_ja: "在ウェリントンタイ王国大使館", name_en: "Royal Thai Embassy, Wellington", url: "https://wellington.thaiembassy.org" },
        ],
      },
    ],
  },
  {
    id: "central-asia",
    label_ja: "中央アジア・ロシア",
    label_en: "Central Asia & Russia",
    countries: [
      { country_ja: "カザフスタン", country_en: "Kazakhstan",         consulates: [{ id: "kz-astana", type: "大使館", city_ja: "アスタナ", city_en: "Astana", name_ja: "在アスタナタイ王国大使館", name_en: "Royal Thai Embassy, Astana", url: "https://astana.thaiembassy.org" }] },
      { country_ja: "ロシア",       country_en: "Russian Federation", consulates: [{ id: "ru-moscow", type: "大使館", city_ja: "モスクワ", city_en: "Moscow", name_ja: "在モスクワタイ王国大使館", name_en: "Royal Thai Embassy, Moscow", url: "https://moscow.thaiembassy.org" }] },
    ],
  },
];

// Find the region ID and country for a consulate (used to pre-fill cascade selects)
export function findConsulateLocation(id: string): { regionId: string; countryJa: string } | null {
  for (const region of CONSULATE_REGIONS) {
    for (const country of region.countries) {
      if (country.consulates.some((c) => c.id === id)) {
        return { regionId: region.id, countryJa: country.country_ja };
      }
    }
  }
  return null;
}

// Flat lookup by consulate ID
export function findConsulateById(id: string): (Consulate & { country_ja: string; country_en: string; region_ja: string }) | null {
  for (const region of CONSULATE_REGIONS) {
    for (const country of region.countries) {
      for (const c of country.consulates) {
        if (c.id === id) {
          return { ...c, country_ja: country.country_ja, country_en: country.country_en, region_ja: region.label_ja };
        }
      }
    }
  }
  return null;
}
