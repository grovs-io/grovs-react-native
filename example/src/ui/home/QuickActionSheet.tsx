import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TransactionType } from 'react-native-grovs-wrapper';
import {
  eventNameError,
  MAX_TAG_LENGTH,
  MAX_TAGS,
  RESERVED_EVENTS,
  tagsError,
} from '../../data/eventRules';
import { isPurchaseValid, linkFormError } from '../../data/forms';
import { parseAmountToCents } from '../../data/money';
import { useTheme } from '../../theme/ThemeContext';
import { type } from '../../theme/type';
import { FieldLabel, HelpText, Segment } from '../controls/Basics';
import { AppButton, TextAction } from '../controls/Buttons';
import { ChipInput, ChipPicker } from '../controls/Chips';
import { MoneyField, SuggestField } from '../controls/Fields';
import { KeyValueRows } from '../controls/KeyValueRows';
import { Sheet } from '../controls/Sheet';
import { help } from '../help';
import type { useHome } from './useHome';

export type QuickAction = 'link' | 'track' | 'purchase';

type Home = ReturnType<typeof useHome>;
type FormProps = { home: Home; onDone: () => void };

const TITLES: Record<QuickAction, string> = {
  link: 'Generate link',
  track: 'Track event',
  purchase: 'Purchase',
};
const EVENT_NAMES = ['demo_tapped', 'signup', 'level_complete'];
const PURCHASE_TYPES: TransactionType[] = ['buy', 'cancel', 'refund'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'RON'];
const PRODUCTS = ['pro_monthly', 'pro_yearly', 'coins_100'];

function LinkForm({ home, onDone }: FormProps) {
  const [form, setForm] = useState(home.linkForm);
  const formError = linkFormError(form);
  return (
    <>
      <SuggestField
        label="Title"
        value={form.title}
        onChange={(title) => setForm({ ...form, title })}
        suggestions={['Test title']}
      />
      <SuggestField
        label="Subtitle"
        value={form.subtitle}
        onChange={(subtitle) => setForm({ ...form, subtitle })}
        suggestions={['Test subtitle']}
      />
      <KeyValueRows
        label="Data"
        info={help.linkData}
        rows={form.data}
        onChange={(data) => setForm({ ...form, data })}
        suggestedKeys={['promo', 'product_id']}
      />
      <AppButton
        title="Save and generate"
        disabled={home.generating || formError !== null}
        disabledReason={formError ?? undefined}
        onPress={() => {
          home.saveLinkForm(form);
          home.generate(form);
          onDone();
        }}
      />
    </>
  );
}

function TrackForm({ home, onDone }: FormProps) {
  const [form, setForm] = useState(home.eventForm);
  const nameError = eventNameError(form.name);
  const tagError = tagsError(form.tags);
  const reserved = RESERVED_EVENTS.includes(form.name.trim().toLowerCase());
  const send = (force: boolean) => {
    home.saveEventForm(form);
    home.track(form, force);
    onDone();
  };
  return (
    <>
      <SuggestField
        label="Event name"
        value={form.name}
        onChange={(name) => setForm({ ...form, name })}
        suggestions={EVENT_NAMES}
        error={nameError}
        mono
      />
      {reserved ? (
        <TextAction title="Send anyway" onPress={() => send(true)} />
      ) : null}
      <KeyValueRows
        label="Properties"
        info={help.eventPropertiesAndTags}
        rows={form.properties}
        onChange={(properties) => setForm({ ...form, properties })}
        suggestedKeys={['level', 'source']}
      />
      <View>
        <ChipInput
          label="Tags"
          values={form.tags}
          onChange={(tags) => setForm({ ...form, tags })}
          placeholder="Add tag"
          max={MAX_TAGS}
          maxLength={MAX_TAG_LENGTH}
        />
        {tagError ? <HelpText text={tagError} isError /> : null}
      </View>
      <AppButton
        title="Save and track"
        disabled={nameError !== null || tagError !== null}
        onPress={() => send(false)}
      />
    </>
  );
}

function PurchaseForm({ home, onDone }: FormProps) {
  const [form, setForm] = useState(home.purchaseForm);
  return (
    <>
      <Segment
        options={PURCHASE_TYPES}
        value={form.type}
        onChange={(value) => setForm({ ...form, type: value })}
        label={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
      />
      <View>
        <FieldLabel text="Amount" />
        <MoneyField
          cents={parseAmountToCents(form.amount)}
          currency={form.currency}
          onChange={(_, amount) => setForm({ ...form, amount })}
        />
      </View>
      <ChipPicker
        label="Currency"
        options={CURRENCIES}
        value={form.currency}
        onChange={(currency) =>
          setForm({ ...form, currency: currency.toUpperCase() })
        }
        otherPlaceholder="Code, e.g. JPY"
      />
      <ChipPicker
        label="Product"
        options={PRODUCTS}
        value={form.productId}
        onChange={(productId) => setForm({ ...form, productId })}
        otherPlaceholder="product id"
      />
      <AppButton
        title="Save and log"
        disabled={!isPurchaseValid(form)}
        onPress={() => {
          home.savePurchaseForm(form);
          home.purchase(form);
          onDone();
        }}
      />
    </>
  );
}

const FORMS: Record<QuickAction, (props: FormProps) => React.ReactElement> = {
  link: LinkForm,
  track: TrackForm,
  purchase: PurchaseForm,
};

/** Edits the saved values of one quick action, then runs it. A new `openCount` starts from the saved values again. */
export function QuickActionSheet({
  action,
  visible,
  openCount,
  home,
  onClose,
}: {
  action: QuickAction;
  visible: boolean;
  openCount: number;
  home: Home;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const Form = FORMS[action];
  return (
    <Sheet visible={visible} onClose={onClose} heightRatio={null}>
      <Text style={[type.heading, styles.title, { color: colors.text }]}>
        {TITLES[action]}
      </Text>
      <View style={styles.fields}>
        <Form key={openCount} home={home} onDone={onClose} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 8 },
  fields: { gap: 12 },
});
