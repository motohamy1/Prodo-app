'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export interface NoteBodyEditorHandle {
  toggleHeading: (level: 1 | 2 | 3) => void;
  toggleChecklist: () => void;
  toggleBullet: () => void;
  toggleNumber: () => void;
  toggleQuote: () => void;
  insertHashtag: () => void;
  applyInlineFormat: (marker: '**' | '__' | '~~') => void;
  insertDivider: () => void;
  getPlainText: () => string;
  focus: () => void;
}

interface NoteBodyEditorProps {
  value: string;
  onChange: (text: string) => void;
  onCursorChange?: (pos: number) => void;
  colors: any;
  isArabic: boolean;
  isDark: boolean;
  baseStyle?: any;
  placeholder?: string;
}

type LineType =
  | 'normal'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bullet'
  | 'number'
  | 'quote'
  | 'checkbox';

interface ParsedLine {
  type: LineType;
  indent: string;
  marker: string;
}

const mdLine = (raw: string): ParsedLine => {
  const line = raw || '';
  if (/^\s*#{3}\s?/.test(line)) return { type: 'h3', indent: '', marker: '### ' };
  if (/^\s*#{2}\s?/.test(line)) return { type: 'h2', indent: '', marker: '## ' };
  if (/^\s*#{1}\s?/.test(line)) return { type: 'h1', indent: '', marker: '# ' };
  if (/^\s*>\s?/.test(line)) return { type: 'quote', indent: '', marker: '> ' };
  if (/^\s*[-*]\s+\[[ xX]\]\s?/.test(line))
    return { type: 'checkbox', indent: (line.match(/^(\s*)/) || ['', ''])[1], marker: '[ ] ' };
  if (/^\s*[-*]\s+/.test(line)) return { type: 'bullet', indent: (line.match(/^(\s*)/) || ['', ''])[1], marker: '• ' };
  if (/^\s*\d+\.\s+/.test(line)) return { type: 'number', indent: (line.match(/^(\s*)/) || ['', ''])[1], marker: 'N. ' };
  return { type: 'normal', indent: '', marker: '' };
};

const markerFor = (type: LineType, indent: string): string => {
  switch (type) {
    case 'h1': return '# ';
    case 'h2': return '## ';
    case 'h3': return '### ';
    case 'quote': return '> ';
    case 'bullet': return indent + '• ';
    case 'number': return indent + '1. ';
    case 'checkbox': return indent + '[ ] ';
    default: return '';
  }
};

const INLINE_RE = /(\*\*([^*]+)\*\*)|(__([^_]+)__)|(~~([^~]+)~~)|(#\w+)|(\[[ xX]\]\s)/g;

const parseInline = (text: string, base: any) => {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;
  let key = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) nodes.push(<Text key={key++} style={{ fontWeight: '800' }}>{m[2]}</Text>);
    else if (m[4] !== undefined) nodes.push(<Text key={key++} style={{ fontStyle: 'italic' }}>{m[4]}</Text>);
    else if (m[6] !== undefined) nodes.push(<Text key={key++} style={{ textDecorationLine: 'line-through', opacity: 0.6 }}>{m[6]}</Text>);
    else if (m[7] !== undefined) nodes.push(<Text key={key++} style={{ color: base.tagColor || '#4a9eff', fontWeight: '700' }}>{m[7]}</Text>);
    else if (m[8] !== undefined) nodes.push(<Text key={key++}>{m[8]}</Text>);
    last = INLINE_RE.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
};

const RenderLine = ({ line, base, isArabic }: { line: string; base: any; isArabic: boolean }) => {
  const { type, indent } = mdLine(line);
  const content = line.replace(/^(\s*)(#{1,3}|>|[-*]\s+\[[ xX]\]\s|[-*]\s+|\d+\.\s+)/, '');

  if (type === 'h1' || type === 'h2' || type === 'h3') {
    const size = type === 'h1' ? 26 : type === 'h2' ? 21 : 18;
    return (
      <Text style={[{ fontSize: size, fontWeight: '800', color: base.headingColor, marginVertical: 4, textAlign: isArabic ? 'right' : 'left' }, base.baseFont]}>
        {parseInline(content, base)}
      </Text>
    );
  }
  if (type === 'quote') {
    return (
      <View style={{ flexDirection: 'row', marginVertical: 4, borderLeftWidth: 3, borderLeftColor: base.accent, paddingLeft: 10 }}>
        <Text style={[{ fontSize: 16, fontStyle: 'italic', color: base.quoteColor, flex: 1, textAlign: isArabic ? 'right' : 'left' }, base.baseFont]}>
          {parseInline(content, base)}
        </Text>
      </View>
    );
  }
  if (type === 'bullet' || type === 'number') {
    const isNum = type === 'number';
    const bullet = isNum ? (line.match(/^\s*(\d+)\./) || ['', '1'])[1] + '.' : '•';
    return (
      <View style={{ flexDirection: 'row', marginVertical: 2, paddingLeft: indent.length * 12 }}>
        <Text style={[{ fontSize: 16, color: base.bulletColor, width: 24, textAlign: 'center' }, base.baseFont]}>{bullet}</Text>
        <Text style={[{ fontSize: 16, color: base.text, flex: 1, textAlign: isArabic ? 'right' : 'left' }, base.baseFont]}>
          {parseInline(content, base)}
        </Text>
      </View>
    );
  }
  if (type === 'checkbox') {
    const checked = /^\s*[-*]\s+\[[xX]\]\s?/.test(line);
    const text = content;
    return (
      <View style={{ flexDirection: 'row', marginVertical: 3, alignItems: 'center' }}>
        <View style={{
          width: 20, height: 20, borderRadius: 6, marginRight: 10,
          borderWidth: 2, borderColor: checked ? base.accent : base.muted,
          backgroundColor: checked ? base.accent : 'transparent',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {checked && <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>✓</Text>}
        </View>
        <Text style={[{ fontSize: 16, flex: 1, color: checked ? base.muted : base.text, textDecorationLine: checked ? 'line-through' : 'none', textAlign: isArabic ? 'right' : 'left' }, base.baseFont]}>
          {parseInline(text, base)}
        </Text>
      </View>
    );
  }
  return (
    <Text style={[{ fontSize: 16, color: base.text, marginVertical: 2, lineHeight: 24, textAlign: isArabic ? 'right' : 'left' }, base.baseFont]}>
      {parseInline(content, base)}
    </Text>
  );
};

const NoteBodyEditor = forwardRef<NoteBodyEditorHandle, NoteBodyEditorProps>((props, ref) => {
  const { value, onChange, onCursorChange, colors, isArabic, isDark, baseStyle, placeholder } = props;
  const activeFontFamily = baseStyle?.fontFamily;
  const activeFontWeight = baseStyle?.fontWeight || 'normal';
  const activeFontStyle = baseStyle?.fontStyle || 'normal';
  const activeFontColor = baseStyle?.color || colors.text;

  const base = useMemo(
    () => ({
      text: activeFontColor,
      headingColor: isDark ? '#ffffff' : '#111111',
      quoteColor: isDark ? '#c9c9c9' : '#555555',
      bulletColor: isDark ? '#e0e0e0' : '#222222',
      muted: colors.textMuted,
      accent: colors.accent || '#4a9eff',
      tagColor: '#4a9eff',
      baseFont: { fontFamily: activeFontFamily, fontWeight: activeFontWeight as any, fontStyle: activeFontStyle as any },
    }),
    [activeFontColor, isDark, colors, activeFontFamily, activeFontWeight, activeFontStyle]
  );

  const [lines, setLines] = useState<string[]>(() => (value && value.length ? value.split('\n') : ['']));
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const inputRef = useRef<TextInput | null>(null);
  const lastTypeRef = useRef<LineType>('normal');
  const [lineLayouts, setLineLayouts] = useState<Record<number, { x: number; y: number; width: number; height: number }>>({});
  const lastLayoutRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(Dimensions.get('window').width - 48);

  useEffect(() => {
    const next = value && value.length ? value.split('\n') : [''];
    setLines((prev) => (prev.join('\n') === next.join('\n') ? prev : next));
  }, [value]);

  const commit = useCallback(
    (next: string[]) => {
      setLines(next);
      onChange(next.join('\n'));
    },
    [onChange]
  );

  const startEditing = useCallback(
    (idx: number) => {
      setActiveLine(idx);
      lastTypeRef.current = mdLine(lines[idx] ?? '').type;
    },
    [lines]
  );

  const handleBlurCommit = useCallback(() => {
    setActiveLine(null);
  }, []);

  const recordLayout = useCallback((idx: number, layout: { x: number; y: number; width: number; height: number }) => {
    lastLayoutRef.current = layout;
    setLineLayouts((prev) => {
      const old = prev[idx];
      if (old && old.x === layout.x && old.y === layout.y && old.width === layout.width && old.height === layout.height) {
        return prev;
      }
      return { ...prev, [idx]: layout };
    });
  }, []);

  const handleTextChange = useCallback(
    (idx: number, newText: string) => {
      const nl = newText.indexOf('\n');
      if (nl >= 0) {
        const before = newText.slice(0, nl);
        const after = newText.slice(nl + 1);
        const cur = lines[idx] ?? '';
        const { type } = mdLine(cur);
        const m = cur.match(/^(\s*)([#>\-*]|\d+\.)\s?(.*)$/);
        let insertMarker = markerFor(type, (cur.match(/^(\s*)/) || ['', ''])[1]);
        let clearToNormal = false;

        if (type === 'checkbox') {
          const cm = cur.match(/^(\s*)[-*]\s*\[[ xX]\]\s?(.*)$/);
          const txt = cm ? cm[2] : cur.replace(/^\s*[-*]\s*\[[ xX]\]\s?/, '');
          if (txt.trim() === '') { insertMarker = ''; clearToNormal = true; }
          else insertMarker = (cm ? cm[1] : '') + '[ ] ';
        } else if (type === 'number') {
          const nm = cur.match(/^(\s*)(\d+)\.\s?(.*)$/);
          const num = nm ? parseInt(nm[2], 10) : 1;
          const txt = nm ? nm[3] : '';
          if (txt.trim() === '') { insertMarker = ''; clearToNormal = true; }
          else insertMarker = (nm ? nm[1] : '') + (num + 1) + '. ';
        } else if (type === 'bullet') {
          const bm = cur.match(/^(\s*)[-*]\s?(.*)$/);
          const txt = bm ? bm[2] : '';
          if (txt.trim() === '') { insertMarker = ''; clearToNormal = true; }
          else insertMarker = (bm ? bm[1] : '') + '• ';
        } else if (type === 'h1' || type === 'h2' || type === 'h3' || type === 'quote') {
          const txt = m ? m[3] : '';
          if (txt.trim() === '') { insertMarker = ''; clearToNormal = true; }
        }

        const afterParts = after.split('\n');
        const next = [...lines];
        next[idx] = before;
        next.splice(idx + 1, 0, (clearToNormal ? '' : insertMarker) + afterParts[0]);
        for (let i = 1; i < afterParts.length; i++) next.splice(idx + 1 + i, 0, afterParts[i]);
        lastTypeRef.current = clearToNormal || type === 'normal' ? 'normal' : type;
        commit(next);
        setActiveLine(idx + 1);
        setTick((t) => t + 1);
        onCursorChange?.(before.length);
        return;
      }

      const next = [...lines];
      next[idx] = newText;
      commit(next);
      onCursorChange?.(newText.length);
    },
    [lines, commit, onCursorChange]
  );

  const startLineEdit = useCallback(
    (idx: number) => {
      const cur = lines[idx] ?? '';
      const { type, indent } = mdLine(cur);
      let newText = cur;
      if (type === 'normal') {
        newText = markerFor(lastTypeRef.current, indent) + cur;
      } else {
        const stripped = cur.replace(/^(\s*)(#{1,3}|>|[-*]\s+\[[ xX]\]\s|[-*]\s+|\d+\.\s+)/, '');
        newText = markerFor('normal', indent) + stripped;
        lastTypeRef.current = 'normal';
      }
      const next = [...lines];
      next[idx] = newText;
      commit(next);
      setActiveLine(idx);
      setTick((t) => t + 1);
      onCursorChange?.(newText.length);
    },
    [lines, commit, onCursorChange]
  );

  const toggleHeading = useCallback(
    (level: 1 | 2 | 3) => {
      const idx = activeLine ?? lines.length - 1;
      const cur = lines[idx] ?? '';
      const { type, indent } = mdLine(cur);
      let newText: string;
      if (type === (`h${level}` as LineType)) {
        newText = cur.replace(/^(\s*)#{1,3}\s?/, indent);
        lastTypeRef.current = 'normal';
      } else {
        const stripped = cur.replace(/^(\s*)(#{1,3}|>|[-*]\s+\[[ xX]\]\s|[-*]\s+|\d+\.\s+)/, '');
        newText = indent + '#'.repeat(level) + ' ' + stripped;
        lastTypeRef.current = (`h${level}` as LineType);
      }
      const next = [...lines];
      next[idx] = newText;
      commit(next);
      setActiveLine(idx);
      setTick((t) => t + 1);
      onCursorChange?.(newText.length);
    },
    [activeLine, lines, commit, onCursorChange]
  );

  const toggleChecklist = useCallback(() => {
    const idx = activeLine ?? lines.length - 1;
    const cur = lines[idx] ?? '';
    const { type, indent } = mdLine(cur);
    let newText: string;
    if (type === 'checkbox') {
      newText = cur.replace(/^(\s*)[-*]\s+\[[ xX]\]\s?/, indent);
      lastTypeRef.current = 'normal';
    } else {
      const stripped = cur.replace(/^(\s*)(#{1,3}|>|[-*]\s+\[[ xX]\]\s|[-*]\s+|\d+\.\s+)/, '');
      newText = indent + '- [ ] ' + stripped;
      lastTypeRef.current = 'checkbox';
    }
    const next = [...lines];
    next[idx] = newText;
    commit(next);
    setActiveLine(idx);
    setTick((t) => t + 1);
    onCursorChange?.(newText.length);
  }, [activeLine, lines, commit, onCursorChange]);

  const toggleBullet = useCallback(() => {
    const idx = activeLine ?? lines.length - 1;
    const cur = lines[idx] ?? '';
    const { type, indent } = mdLine(cur);
    let newText: string;
    if (type === 'bullet') {
      newText = cur.replace(/^(\s*)[-*]\s?/, indent);
      lastTypeRef.current = 'normal';
    } else {
      const stripped = cur.replace(/^(\s*)(#{1,3}|>|[-*]\s+\[[ xX]\]\s|[-*]\s+|\d+\.\s+)/, '');
      newText = indent + '• ' + stripped;
      lastTypeRef.current = 'bullet';
    }
    const next = [...lines];
    next[idx] = newText;
    commit(next);
    setActiveLine(idx);
    setTick((t) => t + 1);
    onCursorChange?.(newText.length);
  }, [activeLine, lines, commit, onCursorChange]);

  const toggleNumber = useCallback(() => {
    const idx = activeLine ?? lines.length - 1;
    const cur = lines[idx] ?? '';
    const { type, indent } = mdLine(cur);
    let newText: string;
    if (type === 'number') {
      newText = cur.replace(/^(\s*)\d+\.\s?/, indent);
      lastTypeRef.current = 'normal';
    } else {
      const stripped = cur.replace(/^(\s*)(#{1,3}|>|[-*]\s+\[[ xX]\]\s|[-*]\s+|\d+\.\s+)/, '');
      newText = indent + '1. ' + stripped;
      lastTypeRef.current = 'number';
    }
    const next = [...lines];
    next[idx] = newText;
    commit(next);
    setActiveLine(idx);
    setTick((t) => t + 1);
    onCursorChange?.(newText.length);
  }, [activeLine, lines, commit, onCursorChange]);

  const toggleQuote = useCallback(() => {
    const idx = activeLine ?? lines.length - 1;
    const cur = lines[idx] ?? '';
    const { type, indent } = mdLine(cur);
    let newText: string;
    if (type === 'quote') {
      newText = cur.replace(/^(\s*)>\s?/, indent);
      lastTypeRef.current = 'normal';
    } else {
      const stripped = cur.replace(/^(\s*)(#{1,3}|>|[-*]\s+\[[ xX]\]\s|[-*]\s+|\d+\.\s+)/, '');
      newText = indent + '> ' + stripped;
      lastTypeRef.current = 'quote';
    }
    const next = [...lines];
    next[idx] = newText;
    commit(next);
    setActiveLine(idx);
    setTick((t) => t + 1);
    onCursorChange?.(newText.length);
  }, [activeLine, lines, commit, onCursorChange]);

  const insertHashtag = useCallback(() => {
    const idx = activeLine ?? lines.length - 1;
    const cur = lines[idx] ?? '';
    const insert = cur.length && !/\s$/.test(cur) ? ' #tag' : '#tag';
    const next = [...lines];
    next[idx] = cur + insert;
    commit(next);
    setActiveLine(idx);
    setTick((t) => t + 1);
    onCursorChange?.(next[idx].length);
  }, [activeLine, lines, commit, onCursorChange]);

  const applyInlineFormat = useCallback(
    (marker: '**' | '__' | '~~') => {
      const idx = activeLine ?? lines.length - 1;
      const cur = lines[idx] ?? '';
      const newText = cur.length ? `${marker}${cur}${marker}` : `${marker}text${marker}`;
      const next = [...lines];
      next[idx] = newText;
      commit(next);
      setActiveLine(idx);
      setTick((t) => t + 1);
      onCursorChange?.(newText.length);
    },
    [activeLine, lines, commit, onCursorChange]
  );

  const insertDivider = useCallback(() => {
    const idx = activeLine ?? lines.length - 1;
    const next = [...lines];
    next.splice(idx + 1, 0, '---');
    next.splice(idx + 2, 0, '');
    commit(next);
    setActiveLine(idx + 2);
    setTick((t) => t + 1);
    onCursorChange?.(0);
  }, [activeLine, lines, commit, onCursorChange]);

  const toggleCheckOnLine = useCallback(
    (idx: number) => {
      const cur = lines[idx] ?? '';
      if (!/^\s*[-*]\s+\[[ xX]\]\s?/.test(cur)) return;
      const newText = cur.replace(/^(\s*[-*]\s+\[)([ xX])(\]\s?)/, (_m, a, b, c) => `${a}${b === ' ' ? 'x' : ' '}${c}`);
      const next = [...lines];
      next[idx] = newText;
      commit(next);
      setTick((t) => t + 1);
    },
    [lines, commit]
  );

  useImperativeHandle(ref, () => ({
    toggleHeading,
    toggleChecklist,
    toggleBullet,
    toggleNumber,
    toggleQuote,
    insertHashtag,
    applyInlineFormat,
    insertDivider,
    getPlainText: () => lines.join('\n'),
    focus: () => inputRef.current?.focus(),
  }));

  // Keep focus on the body editor whenever the active line changes (this is what
  // prevents the focus from falling back to the title input).
  useEffect(() => {
    if (activeLine !== null && inputRef.current) {
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [activeLine, tick]);

  const activeLayout = activeLine !== null ? lineLayouts[activeLine] ?? lastLayoutRef.current : null;
  const activeMd = activeLine !== null ? mdLine(lines[activeLine] ?? '') : null;
  const isActiveCheckbox = activeMd?.type === 'checkbox';
  const checkboxOffset = isActiveCheckbox ? 30 : 0;

  const overlayStyle: any = useMemo(() => {
    const size = activeMd
      ? activeMd.type === 'h1' ? 26 : activeMd.type === 'h2' ? 21 : activeMd.type === 'h3' ? 18 : activeMd.type === 'quote' ? 16 : 16
      : 16;
    const weight = activeMd && (activeMd.type === 'h1' || activeMd.type === 'h2' || activeMd.type === 'h3') ? '800' : (activeFontWeight as any);
    return {
      position: 'absolute',
      paddingVertical: 2,
      paddingHorizontal: 0,
      fontSize: size,
      fontWeight: weight,
      fontStyle: activeFontStyle as any,
      fontFamily: activeFontFamily,
      color: activeFontColor,
      lineHeight: size * 1.4,
      textAlign: isArabic && /[؀-ۿ]/.test(lines[activeLine ?? -1] ?? '') ? 'right' : 'left',
    };
  }, [activeMd, activeFontWeight, activeFontStyle, activeFontFamily, activeFontColor, isArabic, lines, activeLine]);

  return (
    <View
      style={{ flex: 1, position: 'relative' }}
      onStartShouldSetResponderCapture={(e) => {
        const target = (e.target as any)?.props?.children;
        if (target === undefined) {
          if (activeLine !== null) handleBlurCommit();
        }
        return false;
      }}
    >
      <View
        style={{ position: 'relative', paddingHorizontal: 16 }}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width - 32)}
      >
        {lines.map((line, idx) => {
          const isActive = idx === activeLine;
          return (
            <View
              key={`line-${idx}`}
              onLayout={(e) => recordLayout(idx, e.nativeEvent.layout)}
              style={{ paddingVertical: 3, minHeight: 24 }}
            >
              {isActive ? (
                <View style={{ opacity: 0 }}>
                  <RenderLine line={line} base={base} isArabic={isArabic} />
                </View>
              ) : (
                <TouchableWithoutFeedback onPress={() => startEditing(idx)}>
                  <View>
                    <RenderLine line={line} base={base} isArabic={isArabic} />
                  </View>
                </TouchableWithoutFeedback>
              )}
            </View>
          );
        })}

        {lines.length === 1 && lines[0] === '' && (
          <Text style={{ position: 'absolute', top: 3, left: 16, color: colors.textMuted, fontSize: 16 }}>
            {placeholder || (isArabic ? 'ابدأ الكتابة...' : 'Start typing...')}
          </Text>
        )}
      </View>

      {activeLine !== null && (
        <TextInput
          key="note-editor-input"
          ref={inputRef}
          style={[
            overlayStyle,
            {
              top: (activeLayout?.y ?? 0) + 3,
              left: (activeLayout?.x ?? 0) + checkboxOffset,
              width: (activeLayout?.width ?? containerWidth) - checkboxOffset,
              height: activeLayout?.height ?? 28,
            },
          ]}
          value={lines[activeLine] ?? ''}
          onChangeText={(t) => handleTextChange(activeLine, t)}
          onBlur={handleBlurCommit}
          multiline
          blurOnSubmit={false}
          autoFocus={false}
          scrollEnabled={false}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent || '#4a9eff'}
        />
      )}

      {activeLine !== null && isActiveCheckbox && activeLayout && (
        <TouchableWithoutFeedback onPress={() => toggleCheckOnLine(activeLine)}>
          <View
            style={{
              position: 'absolute',
              top: activeLayout.y + 4,
              left: activeLayout.x,
              width: 26,
              height: 26,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 20, height: 20, borderRadius: 6,
                borderWidth: 2,
                borderColor: /\[[xX]\]/.test(lines[activeLine] ?? '') ? (colors.accent || '#4a9eff') : colors.textMuted,
                backgroundColor: /\[[xX]\]/.test(lines[activeLine] ?? '') ? (colors.accent || '#4a9eff') : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {/\[[xX]\]/.test(lines[activeLine] ?? '') && (
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>✓</Text>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
});

NoteBodyEditor.displayName = 'NoteBodyEditor';

export default NoteBodyEditor;
