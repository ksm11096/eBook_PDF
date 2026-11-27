import { AlbumPhoto } from '../types/album';

export const SAMPLE_ALBUM_PHOTOS: AlbumPhoto[] = [
  {
    id: 'sample-1',
    src: '/src/assets/images/sample_album_architecture_1795738797848.jpg',
    fileName: 'gallery-light.jpg',
    title: '오후 네 시의 콘크리트 갤러리',
    description:
      '높은 창으로 스며든 늦은 오후의 빛이 트래버틴 바닥 위로 긴 선을 그립니다. 고요한 전시실 안에 머문 그림자의 결을 기록했습니다.',
    isSample: true,
  },
  {
    id: 'sample-2',
    src: '/src/assets/images/sample_album_coast_1795738798797.jpg',
    fileName: 'dawn-coast.jpg',
    title: '안개 낀 새벽의 현무암 해안',
    description:
      '해가 뜨기 직전, 짙은 현무암 바위 너머로 낮게 내려앉은 바다 안개. 모든 소리가 잦아든 이른 아침의 수평선입니다.',
    isSample: true,
  },
  {
    id: 'sample-3',
    src: '/src/assets/images/sample_album_still_life_1795738799692.jpg',
    fileName: 'ceramic-linen.jpg',
    title: '린넨 위의 도자기 세 점',
    description:
      '창가 나무 선반 위에 놓인 거친 질감의 다기들과 마른 가지. 부드러운 자연광이 감싸는 정물의 오후를 담았습니다.',
    isSample: true,
  },
];
