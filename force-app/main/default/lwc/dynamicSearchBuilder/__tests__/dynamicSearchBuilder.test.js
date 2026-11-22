import { createElement } from '@lwc/engine-dom';
import DynamicSearchBuilder from 'c/dynamicSearchBuilder';

describe('c-dynamic-search-builder', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders the component heading', () => {
        const element = createElement('c-dynamic-search-builder', {
            is: DynamicSearchBuilder
        });

        document.body.appendChild(element);

        const heading = element.shadowRoot.querySelector('.builder-title');
        expect(heading).not.toBeNull();
        expect(heading.textContent).toContain('Dynamic Search & Filter Builder');
    });
});
