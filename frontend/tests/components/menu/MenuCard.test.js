/**
 * MenuCard 컴포넌트 단위 테스트
 * Unit 2: menu-management
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCard from '../../../src/components/menu/MenuCard.vue';

describe('MenuCard', () => {
  const menu = {
    id: 'menu-1',
    name: '아메리카노',
    price: 4500,
    imageUrl: '/uploads/store-1/menus/menu-1.jpg',
    isActive: true,
  };

  it('메뉴명과 가격을 표시한다', () => {
    const wrapper = mount(MenuCard, { props: { menu } });

    expect(wrapper.text()).toContain('아메리카노');
    expect(wrapper.text()).toContain('4,500원');
  });

  it('이미지가 있으면 img 태그를 렌더링한다', () => {
    const wrapper = mount(MenuCard, { props: { menu } });

    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe(menu.imageUrl);
  });

  it('이미지가 없으면 플레이스홀더를 표시한다', () => {
    const wrapper = mount(MenuCard, {
      props: { menu: { ...menu, imageUrl: null } },
    });

    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('클릭 시 click 이벤트를 발생시킨다', async () => {
    const wrapper = mount(MenuCard, { props: { menu } });

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('click')).toBeTruthy();
    expect(wrapper.emitted('click')[0]).toEqual([menu]);
  });

  it('data-testid 속성이 올바르게 설정된다', () => {
    const wrapper = mount(MenuCard, { props: { menu } });

    expect(wrapper.find('[data-testid="menu-card-menu-1"]').exists()).toBe(true);
  });
});
