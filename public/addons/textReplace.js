 String.prototype.myToLowerCase = function() {
   let result = '';
   for (let i = 0; i < this.length; i++) {
     const code = this.charCodeAt(i);
     if (code >= 65 && code <= 90) {
       result += String.fromCharCode(code + 32);
     } else {
       result += this[i];
     }
   }
   return result;
 };

function onLoad(addon) {
  const { saveAddonData, getAddonData, getAllAddonData } = addon.persistence;

  const persistedRules = getAddonData('rules', []);

  const rules = Array.isArray(persistedRules)
    ? persistedRules.filter(
        rule =>
          rule &&
          typeof rule.from === 'string' &&
          typeof rule.to === 'string'
      )
    : [];

  console.log(`[TextReplacer] Loaded ${rules.length} persisted rules`);

  addon.registerHook('message:before-send', (messageData) => {
    let { content } = messageData;

    for (const rule of rules) {
      if (rule.from && rule.to) {
        const regex = new RegExp(`\\b${rule.from}\\b`, 'gi');
        content = content.replace(regex, rule.to);
      }
    }

    return {
      ...messageData,
      content,
    };
  });

  const ui = new addon.UIClass(addon.id);

  const fromInput = ui.createInput('from-input', {
    label: 'Find (word)',
    placeholder: 'Enter word to replace...',
  });

  const toInput = ui.createInput('to-input', {
    label: 'Replace with',
    placeholder: 'Enter replacement...',
  });

  const rulesList = ui.createList('rules-list', {
    label: `Active Rules (${rules.length})`,
    items: rules,
    onRemove: (index) => {
      const removed = rules.splice(index, 1)[0];

      saveAddonData('rules', rules);
      rulesList.setItems([...rules]);
      updateRulesLabel();

      console.log(`[TextReplacer] Removed rule: "${removed.from}" -> "${removed.to}"`);
    },
    renderItem: (rule) => ({
      type: 'text',
      content: `"${rule.from}" → "${rule.to}"`,
    }),
  });

  const updateRulesLabel = () => {
    rulesList.setLabel(`Active Rules (${rules.length})`);
  };

  const addButton = ui.createButton('add-rule-btn', {
    label: '+ Add Rule',
    primary: true,
    onClick: () => {
      const from = fromInput.value?.().trim();
      const to = toInput.value?.().trim();

      if (!from || !to) {
        console.warn('[TextReplacer] Please enter both Find and Replace values');
        return;
      }

      if (rules.some(r => r.from.toLowerCase() === from.toLowerCase())) {
        console.warn(`[TextReplacer] Rule for "${from}" already exists`);
        return;
      }

      rules.push({ from, to });
      rulesList.setItems([...rules]);

      saveAddonData('rules', rules);

      fromInput.setValue('');
      toInput.setValue('');

      console.log(`[TextReplacer] Added rule: "${from}" -> "${to}"`);
      updateRulesLabel();
    },
  });

  const inputSection = ui.createSection('input-section', {
    title: 'Add New Rule',
    collapsible: false,
    children: [
      fromInput,
      toInput,
      addButton,
    ],
  });

  const rulesSection = ui.createSection('rules-section', {
    title: 'Current Rules',
    collapsible: false,
    children: [
      rulesList,
    ],
  });

  ui.createPanel({
    title: 'Text Replacer',
    description: 'Replace text in messages before sending',
    elements: [
      inputSection,
      rulesSection,
    ],
  });

  return {
    addRule: (from, to) => {
      if (rules.some(r => r.from.toLowerCase() === from.toLowerCase())) {
        console.warn(`[TextReplacer] Rule for "${from}" already exists`);
        return false;
      }

      rules.push({ from, to });
      rulesList.setItems([...rules]);
      saveAddonData('rules', rules);
      updateRulesLabel();

      console.log(`[TextReplacer] Added rule: "${from}" -> "${to}"`);
      return true;
    },

    removeRule: (from) => {
      const index = rules.findIndex(r => r.from.toLowerCase() === from.toLowerCase());
      if (index === -1) {
        console.warn(`[TextReplacer] Rule for "${from}" not found`);
        return false;
      }

      rules.splice(index, 1);
      rulesList.setItems([...rules]);

      saveAddonData('rules', rules);

      updateRulesLabel();
      console.log(`[TextReplacer] Removed rule: "${from}"`);
      return true;
    },

    getRules: () => [...rules],

    clearRules: () => {
      rules.length = 0;
      rulesList.setItems([]);

      saveAddonData('rules', rules);

      updateRulesLabel();
      console.log('[TextReplacer] Cleared all rules');
    },

    getPersistedData: () => getAllAddonData(),
  };
}
