/**
 * MenuForm 컴포넌트 단위 테스트
 * Unit 2: menu-management
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuForm from '../../../src/components/menu/MenuForm.vue';

const categories = [
  { id: 'cat-1', name: '음료' },
  { id: 'cat-2', name: '식사' },
];

describe('MenuForm', () => {
  it('생성 모드에서 빈 폼을 렌더링한다', () => {
    const wrapper = mount(MenuForm, {
      props: { menu: null, categories },
    });

    expect(wrapper.text()).toContain('메뉴 추가');
    expect(wrapper.find('[data-testid="menu-form-name-input"]').element.value).toBe('');
  });

  it('수정 모드에서 기존 데이터를 채운다', () => {
    const menu = {
      id: 'menu-1',
      categoryId: 'cat-1',
      name: '아메리카노',
      price: 4500,
      description: '맛있는 커피',
    };

    const wrapper = mount(MenuForm, {
      props: { menu, categories },
    });

    expect(wrapper.text()).toContain('메뉴 수정');
    expect(wrapper.find('[data-testid="menu-form-name-input"]').element.value).toBe('아메리카노');
  });

  it('필수 필드가 비어있으면 submit 이벤트를 발생시키지 않는다', async () => {
    const wrapper = mount(MenuForm, {
      props: { menu: null, categories },
    });

    await wrapper.find('form').trigger('submit');

    expect(wrapper.emitted('submit')).toBeFalsy();
  });

  it('유효한 데이터로 submit 이벤트를 발생시킨다', async () => {
    const wrapper = mount(MenuForm, {
      props: { menu: null, categories },
    });

    await wrapper.find('[data-testid="menu-form-category-select"]').setValue('cat-1');
    await wrapper.find('[data-testid="menu-form-name-input"]').setValue('아메리카노');
    await wrapper.find('[data-testid="menu-form-price-input"]').setValue(4500);
    await wrapper.find('form').trigger('submit');

    expect(wrapper.emitted('submit')).toBeTruthy();
    expect(wrapper.emitted('submit')[0][0]).toMatchObject({
      categoryId: 'cat-1',
      name: '아메리카노',
      price: 4500,
    });
  });

  it('취소 버튼 클릭 시 cancel 이벤트를 발생시킨다', async () => {
    const wrapper = mount(MenuForm, {
      props: { menu: null, categories },
    });

    await wrapper.find('[data-testid="menu-form-cancel-button"]').trigger('click');

    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('카테고리 선택 목록을 렌더링한다', () => {
    const wrapper = mount(MenuForm, {
      props: { menu: null, categories },
    });

    const options = wrapper.findAll('option');
    // placeholder + 2 categories
    expect(options.length).toBe(3);
  });
});
