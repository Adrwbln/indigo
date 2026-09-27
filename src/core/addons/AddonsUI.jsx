import { createSignal, Show, For } from "solid-js";
import { createStore } from "solid-js/store";

export const [addonPanels, setAddonPanels] = createStore({
  panels: {},
});

export class AddonUI {
  constructor(addonId) {
    this.addonId = addonId;
    this.elements = new Map();
    this.state = createStore({})[1];
  }

  createInput(id, options = {}) {
    const {
      label = "Input",
      placeholder = "",
      value = "",
      onChange = null,
    } = options;

    const [inputValue, setInputValue] = createSignal(value);

    const element = {
      type: "input",
      id,
      label,
      placeholder,
      value: inputValue,
      setValue: setInputValue,
      onChange,
    };

    this.elements.set(id, element);
    return element;
  }

  createButton(id, options = {}) {
    const {
      label = "Button",
      onClick = null,
      primary = false,
      danger = false,
    } = options;

    const element = {
      type: "button",
      id,
      label,
      onClick,
      primary,
      danger,
    };

    this.elements.set(id, element);
    return element;
  }

  createList(id, options = {}) {
    const {
      label = "List",
      items = [],
      onRemove = null,
      renderItem = null,
    } = options;

    const [listItems, setListItems] = createSignal(items);

    const element = {
      type: "list",
      id,
      label,
      items: listItems,
      setItems: setListItems,
      onRemove,
      renderItem,
    };

    this.elements.set(id, element);
    return element;
  }

  createText(id, options = {}) {
    const {
      label = "",
      content = "",
      className = "",
    } = options;

    const [textContent, setTextContent] = createSignal(content);

    const element = {
      type: "text",
      id,
      label,
      content: textContent,
      setContent: setTextContent,
      className,
    };

    this.elements.set(id, element);
    return element;
  }

  createSection(id, options = {}) {
    const {
      title = "Section",
      children = [],
      collapsible = false,
    } = options;

    const [isExpanded, setIsExpanded] = createSignal(!collapsible);

    const element = {
      type: "section",
      id,
      title,
      children,
      isExpanded,
      setIsExpanded,
      collapsible,
    };

    this.elements.set(id, element);
    return element;
  }

  createPanel(options = {}) {
    const {
      title = "Addon",
      description = "",
      elements = [],
    } = options;

    const panelId = `panel-${this.addonId}`;

    const panel = {
      id: panelId,
      addonId: this.addonId,
      title,
      description,
      elements,
      createdAt: Date.now(),
    };

    setAddonPanels("panels", panelId, panel);

    return panelId;
  }

  updateElement(elementId, updates) {
    const element = this.elements.get(elementId);
    if (!element) return;

    Object.assign(element, updates);
  }

  getElement(elementId) {
    return this.elements.get(elementId);
  }

  removeElement(elementId) {
    this.elements.delete(elementId);
  }

  getAllElements() {
    return Array.from(this.elements.values());
  }
}

export function getAddonPanels() {
  return Object.values(addonPanels.panels);
}

export function getAddonPanel(panelId) {
  return addonPanels.panels[panelId];
}

export function removeAddonPanel(panelId) {
  setAddonPanels("panels", panelId, undefined);
}

export function renderAddonUIElement(element) {
  return (
    <Show when={element} fallback={null}>
      {element.type === "input" && (
        <div class="addon-ui-element addon-ui-input">
          <label>{element.label}</label>
          <input
            type="text"
            placeholder={element.placeholder}
            value={element.value?.()}
            onInput={(e) => {
              element.setValue(e.currentTarget.value);
              element.onChange?.(e.currentTarget.value);
            }}
          />
        </div>
      )}

      {element.type === "button" && (
        <div class="addon-ui-element addon-ui-button">
          <button
            class={`
              addon-btn
              ${element.primary ? "addon-btn-primary" : ""}
              ${element.danger ? "addon-btn-danger" : ""}
            `}
            onClick={() => element.onClick?.()}
          >
            {element.label}
          </button>
        </div>
      )}

      {element.type === "text" && (
        <div class={`addon-ui-element addon-ui-text ${element.className}`}>
          {element.label && <label>{element.label}</label>}
          <p>{element.content?.()}</p>
        </div>
      )}

      {element.type === "list" && (
        <div class="addon-ui-element addon-ui-list">
          <label>{element.label}</label>
          <ul class="addon-ui-list-items">
            <For each={element.items?.()} fallback={<li class="addon-ui-list-empty">No items</li>}>
              {(item, index) => (
                <li class="addon-ui-list-item">
                  <div class="addon-ui-list-content">
                    {element.renderItem ? (() => {
                      const rendered = element.renderItem(item);
                      if (rendered && typeof rendered === 'object' && rendered.content) {
                        return <span>{rendered.content}</span>;
                      }
                      if (typeof rendered === 'string') {
                        return <span>{rendered}</span>;
                      }
                      return <span>{String(item)}</span>;
                    })() : (
                      <span>{String(item)}</span>
                    )}
                  </div>
                  <button
                    class="addon-ui-list-remove"
                    onClick={() => {
                      element.onRemove?.(index(), item);
                      element.setItems((prev) =>
                        prev.filter((_, i) => i !== index())
                      );
                    }}
                  >
                    ×
                  </button>
                </li>
              )}
            </For>
          </ul>
        </div>
      )}

      {element.type === "section" && (
        <div class="addon-ui-element addon-ui-section">
          {element.collapsible && (
            <button
              class="addon-ui-section-header"
              onClick={() =>
                element.setIsExpanded((prev) => !prev)
              }
            >
              <span class={`addon-ui-chevron ${element.isExpanded() ? "expanded" : ""}`}>
                ›
              </span>
              {element.title}
            </button>
          )}
          {!element.collapsible && (
            <h3 class="addon-ui-section-title">{element.title}</h3>
          )}
          <Show when={element.isExpanded?.()}>
            <div class="addon-ui-section-content">
              <For each={element.children}>
                {(child) => renderAddonUIElement(child)}
              </For>
            </div>
          </Show>
        </div>
      )}
    </Show>
  );
}

export function AddonPanelComponent(props) {
  const { panelId } = props;
  const panel = () => getAddonPanel(panelId);

  return (
    <Show when={panel()} fallback={null}>
      {(panelData) => (
        <div class="addon-panel">
          <div class="addon-panel-header">
            <h2 class="addon-panel-title">{panelData().title}</h2>
            {panelData().description && (
              <p class="addon-panel-description">{panelData().description}</p>
            )}
          </div>
          <div class="addon-panel-content">
            <For each={panelData().elements}>
              {(element) => renderAddonUIElement(element)}
            </For>
          </div>
        </div>
      )}
    </Show>
  );
}

export function AddonPanelsComponent() {
  return (
    <div class="addon-panels-container">
      <For each={Object.keys(addonPanels.panels)}>
        {(panelId) => <AddonPanelComponent panelId={panelId} />}
      </For>
    </div>
  );
}
