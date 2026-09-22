// 画像と選択ボタン名はここで編集します。画像はプロジェクト直下からの相対パスで指定します。
// 画像を同じ種類の選択肢へ差し替える場合、キー (man / beach など) は変更しないでください。
// 元画像と縦横比・顔穴位置が違う場合は、下部の alignment も調整します。
export const exhibitSettings = {
  outfits: {
    man: {
      name: {ja: '男性の琉装', en: 'Men’s Ryūsō'},
      image: 'assets/images/costumes/orion-man.png'
    },
    woman: {
      name: {ja: '女性の琉装', en: 'Women’s Ryūsō'},
      image: 'assets/images/costumes/orion-woman.png'
    },
    bird: {
      name: {ja: 'ヤンバルクイナ', en: 'Yanbaru rail'},
      shortName: {ja: 'クイナ', en: 'Rail'},
      image: 'assets/images/face-overlays/yanbaru-kuina.png'
    }
  },
  backgrounds: {
    beach: {
      name: {ja: '海', en: 'Beach'},
      image: 'assets/images/backgrounds/beach.jpg'
    },
    stone: {
      name: {ja: '石畳', en: 'Stone path'},
      image: 'assets/images/backgrounds/ishidatami.jpg'
    },
    'castle-before': {
      name: {ja: '首里城（復元前）', en: 'Shuri Castle (before restoration)'},
      image: 'assets/images/backgrounds/shurijo-before.jpg'
    },
    'castle-after': {
      name: {ja: '首里城（復元後）', en: 'Shuri Castle (after restoration)'},
      image: 'assets/images/backgrounds/shurijo-after.jpg'
    }
  },

  // 以下は画像の形や顔穴の位置が変わった場合だけ編集します。座標は size を基準にします。
  alignment: {
    man: {
      size: {width: 683, height: 1024},
      faceHole: {x: 338.5, y: 228.5, width: 65, height: 79},
      regions: [
        {id: 'head', boxes: [{x: 270, y: 105, width: 145, height: 145}]},
        {id: 'sleeve', boxes: [
          {x: 120, y: 275, width: 190, height: 170},
          {x: 375, y: 275, width: 190, height: 170},
          {x: 120, y: 445, width: 165, height: 115},
          {x: 390, y: 445, width: 175, height: 115}
        ]},
        {id: 'waist', boxes: [{x: 220, y: 445, width: 255, height: 180}]}
      ]
    },
    woman: {
      size: {width: 683, height: 1024},
      faceHole: {x: 344, y: 277, width: 62, height: 76},
      regions: [
        {id: 'hair', boxes: [{x: 275, y: 130, width: 155, height: 150}]},
        {id: 'waist', boxes: [{x: 245, y: 505, width: 195, height: 155}]},
        {id: 'sleeve', boxes: [
          {x: 105, y: 335, width: 205, height: 285},
          {x: 375, y: 335, width: 205, height: 285}
        ]}
      ]
    },
    bird: {
      size: {width: 1254, height: 1254},
      headBounds: {x: 58, y: 99, width: 1136, height: 1049},
      headScale: {width: 1.35, height: 1.25}
    }
  }
};
