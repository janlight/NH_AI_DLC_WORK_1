import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import TableManageView from '../TableManageView.vue';

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { storeId: 'store1' } }),
}));

vi.mock('../../../../api/client', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: [] }) },
}));

describe('TableManageView', () => {
  it('테이블 추가 버튼이 렌더링된다', () => {
    const wrapper = mount(TableManageView, { shallow: true });
    expect(wrapper.find('[data-testid="table-add-button"]').exists()).toBe(true);
  });

  it('테이블 추가 버튼 클릭 시 모달이 표시된다', async () => {
    const wrapper = mount(TableManageView, { shallow: true });
    await wrapper.find('[data-testid="table-add-button"]').trigger('click');
    await nextTick();
    expect(wrapper.findComponent({ name: 'TableSetupModal' }).exists()).toBe(true);
  });
});
