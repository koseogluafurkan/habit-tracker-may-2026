// ─── My Foundation section (Sprint 1) ───────────────────────────────────────
// Three sub-sections:
//   - Anti-Goals: what I refuse to become
//   - Limiting Beliefs: thoughts I'm rewriting
//   - Yearly Goals: 3-year horizon, with optional target date
//
// Full CRUD: every item is user-managed. No hardcoded lists.

import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { confirmDestructive } from '@/utils/alert';

import {
  FONT_BODY,
  FONT_HEADING,
  FONT_MONO,
} from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import {
  addPersonalSetup,
  deletePersonalSetup,
  getPersonalSetups,
  updatePersonalSetup,
} from '@/db/operations';
import type { PersonalSetup, PersonalSetupType } from '@/db/schema';

const SUB_SECTIONS: Array<{
  type: PersonalSetupType;
  num: string;
  title: string;
  blurb: string;
  inputPlaceholder: string;
  accentVar: 'red' | 'blue' | 'black';
  allowTargetDate?: boolean;
}> = [
  {
    type: 'anti-goal',
    num: 'A',
    title: 'Anti-Goals',
    blurb: 'What I refuse to become. Read at the start of each month.',
    inputPlaceholder: 'e.g. "Someone who lives passively"',
    accentVar: 'red',
  },
  {
    type: 'limiting-belief',
    num: 'B',
    title: 'Limiting Beliefs',
    blurb: 'Thoughts I am actively rewriting.',
    inputPlaceholder: 'e.g. "I work better under pressure"',
    accentVar: 'black',
  },
  {
    type: 'yearly-goal',
    num: 'C',
    title: '3-Year Goals',
    blurb: 'Where I want to be in three years. Optional target date.',
    inputPlaceholder: 'e.g. "Run my own product company"',
    accentVar: 'blue',
    allowTargetDate: true,
  },
];

function useSetups(type: PersonalSetupType) {
  const { refreshKey } = useDatabase();
  const [items, setItems] = useState<PersonalSetup[]>([]);

  const load = useCallback(async () => {
    const data = await getPersonalSetups(type);
    setItems(data);
  }, [type, refreshKey]);

  useEffect(() => { load(); }, [load]);
  return { items, reload: load };
}

function ItemRow({
  item,
  accentColor,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  item: PersonalSetup;
  accentColor: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const t = useTheme();
  const done = item.status === 'done';

  return (
    <View style={[styles.itemRow, { borderBottomColor: t.rule }]}>
      <Pressable
        onPress={onToggleStatus}
        hitSlop={6}
        style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: accentColor, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        {done ? <Text style={{ color: accentColor, fontSize: 14, lineHeight: 14 }}>✓</Text> : null}
      </Pressable>

      <View style={{ flex: 1 }}>
        <Text style={{
          fontFamily: FONT_BODY,
          fontSize: 15,
          color: done ? t.faded : t.ink.black,
          textDecorationLine: done ? 'line-through' : 'none',
          lineHeight: 22,
        }}>
          {item.text}
        </Text>
        {item.targetDate ? (
          <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.accent, marginTop: 2, letterSpacing: 1 }}>
            TARGET · {item.targetDate}
          </Text>
        ) : null}
      </View>

      <Pressable onPress={onEdit} hitSlop={6} style={{ paddingHorizontal: 6 }}>
        <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.accent, letterSpacing: 1 }}>EDIT</Text>
      </Pressable>
      <Pressable onPress={onDelete} hitSlop={6} style={{ paddingHorizontal: 6 }}>
        <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.ink.red, letterSpacing: 1 }}>×</Text>
      </Pressable>
    </View>
  );
}

function SubSection({ config }: { config: (typeof SUB_SECTIONS)[number] }) {
  const t = useTheme();
  const { refresh } = useDatabase();
  const { items } = useSetups(config.type);
  const [draft, setDraft] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const accentColor =
    config.accentVar === 'red'  ? t.ink.red :
    config.accentVar === 'blue' ? t.ink.blue : t.ink.black;

  const handleAdd = async () => {
    if (!draft.trim()) return;
    await addPersonalSetup(
      config.type,
      draft.trim(),
      config.allowTargetDate ? { targetDate: targetDate || null } : {},
    );
    setDraft('');
    setTargetDate('');
    refresh();
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editDraft.trim()) return;
    await updatePersonalSetup(editingId, { text: editDraft.trim() });
    setEditingId(null);
    setEditDraft('');
    refresh();
  };

  return (
    <View style={{ marginTop: t.sp.lg }}>
      {/* Sub-heading */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <Text style={{
          fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 2, color: accentColor, fontWeight: '700',
        }}>
          {config.num}
        </Text>
        <Text style={{
          fontFamily: FONT_HEADING, fontSize: 20, fontWeight: '700', color: t.ink.black,
        }}>
          {config.title}
        </Text>
      </View>
      <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginBottom: t.sp.sm }}>
        {config.blurb}
      </Text>

      {/* Items list */}
      {items.length === 0 ? (
        <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginBottom: t.sp.sm }}>
          Nothing here yet.
        </Text>
      ) : (
        items.map((item) =>
          editingId === item.id ? (
            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 }}>
              <TextInput
                style={{
                  flex: 1, borderWidth: 1, borderLeftWidth: 2, borderColor: t.rule, borderLeftColor: accentColor,
                  padding: 10, fontFamily: FONT_BODY, fontSize: 14, color: t.ink.black,
                  backgroundColor: t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)',
                }}
                value={editDraft}
                onChangeText={setEditDraft}
                autoFocus
                onSubmitEditing={handleSaveEdit}
              />
              <Pressable onPress={handleSaveEdit} style={{ paddingHorizontal: 10, paddingVertical: 8, backgroundColor: t.ink.black }}>
                <Text style={{ color: t.paper, fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1 }}>SAVE</Text>
              </Pressable>
              <Pressable onPress={() => { setEditingId(null); setEditDraft(''); }} hitSlop={6}>
                <Text style={{ color: t.faded, fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1 }}>×</Text>
              </Pressable>
            </View>
          ) : (
            <ItemRow
              key={item.id}
              item={item}
              accentColor={accentColor}
              onEdit={() => { setEditingId(item.id); setEditDraft(item.text); }}
              onDelete={async () => {
                const ok = await confirmDestructive('Delete this item?', item.text);
                if (ok) { await deletePersonalSetup(item.id); refresh(); }
              }}
              onToggleStatus={async () => {
                await updatePersonalSetup(item.id, { status: item.status === 'done' ? 'active' : 'done' });
                refresh();
              }}
            />
          )
        )
      )}

      {/* Add form */}
      <View style={{ marginTop: t.sp.sm, gap: 8 }}>
        <TextInput
          style={{
            borderWidth: 1, borderLeftWidth: 2, borderColor: t.rule, borderLeftColor: accentColor,
            padding: 12, fontFamily: FONT_BODY, fontSize: 14, color: t.ink.black,
            backgroundColor: t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)',
          }}
          placeholder={config.inputPlaceholder}
          placeholderTextColor={t.faded}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        {config.allowTargetDate ? (
          <TextInput
            style={{
              borderWidth: 1, borderColor: t.rule,
              padding: 10, fontFamily: FONT_MONO, fontSize: 13, color: t.ink.black,
              backgroundColor: t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)',
            }}
            placeholder="Optional target date (e.g. 2028-12-31)"
            placeholderTextColor={t.faded}
            value={targetDate}
            onChangeText={setTargetDate}
          />
        ) : null}
        <Pressable
          style={{ padding: 12, alignItems: 'center', backgroundColor: accentColor }}
          onPress={handleAdd}>
          <Text style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: '600', color: '#FFF', letterSpacing: 0.3 }}>
            + Add to {config.title}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function MyFoundationSection() {
  return (
    <View>
      {SUB_SECTIONS.map((s) => (
        <SubSection key={s.type} config={s} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
