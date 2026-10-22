import { StyleSheet, View } from 'react-native';
import type { TransactionType } from 'react-native-grovs-wrapper';
import { MAX_TAG_LENGTH, MAX_TAGS } from '../../data/eventRules';
import type { EventForm, PurchaseForm } from '../../data/forms';
import { keysSummary } from '../../data/keyValue';
import { parseAmountToCents } from '../../data/money';
import { FieldLabel, FoldRow, Segment } from '../controls/Basics';
import { TextAction } from '../controls/Buttons';
import { ChipInput, ChipPicker, ChipRow } from '../controls/Chips';
import { MoneyField, SuggestField } from '../controls/Fields';
import { KeyValueRows } from '../controls/KeyValueRows';
import { help } from '../help';

export const EVENT_NAMES = ['signup', 'level_up', 'share'];
const PURCHASE_TYPES: TransactionType[] = ['buy', 'cancel', 'refund'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'RON'];
const PRODUCTS = ['pro_monthly', 'pro_yearly', 'coins_100'];
const START_OPTIONS: Array<[days: number, label: string]> = [
  [0, 'Now'],
  [1, '1 day ago'],
  [30, '30 days ago'],
];

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

export function EventFormFields({
  form,
  update,
  error,
  reserved,
  onTrack,
  onSendAnyway,
}: {
  form: EventForm;
  update: (change: Partial<EventForm>) => void;
  error: string | null;
  reserved: boolean;
  onTrack: () => void;
  onSendAnyway: () => void;
}) {
  const summary = [
    keysSummary(form.properties),
    form.tags.map((tag) => `tag ${tag}`).join(', '),
  ]
    .filter((part) => part !== '')
    .join(' · ');
  return (
    <>
      <SuggestField
        value={form.name}
        onChange={(name) => update({ name })}
        suggestions={EVENT_NAMES}
        error={error}
        mono
        onSubmit={onTrack}
      />
      {reserved ? (
        <View style={styles.sendAnyway}>
          <TextAction title="Send anyway" onPress={onSendAnyway} />
        </View>
      ) : null}
      <FoldRow
        title="Properties and tags"
        summary={summary || 'none'}
        info={help.eventPropertiesAndTags}
      >
        <View style={styles.fields}>
          <KeyValueRows
            label="Properties"
            rows={form.properties}
            onChange={(properties) => update({ properties })}
            suggestedKeys={['level', 'source']}
          />
          <ChipInput
            label="Tags"
            values={form.tags}
            onChange={(tags) => update({ tags })}
            placeholder="Add tag"
            max={MAX_TAGS}
            maxLength={MAX_TAG_LENGTH}
          />
        </View>
      </FoldRow>
    </>
  );
}

export function PurchaseFormFields({
  form,
  update,
}: {
  form: PurchaseForm;
  update: (change: Partial<PurchaseForm>) => void;
}) {
  const startLabel =
    START_OPTIONS.find(([days]) => days === form.startDaysAgo)?.[1] ??
    `${form.startDaysAgo} days ago`;
  return (
    <View style={styles.fields}>
      <Segment
        options={PURCHASE_TYPES}
        value={form.type}
        onChange={(type) => update({ type })}
        label={capitalize}
      />
      <View>
        <FieldLabel text="Amount" />
        <MoneyField
          cents={parseAmountToCents(form.amount)}
          currency={form.currency}
          onChange={(_, amount) => update({ amount })}
        />
      </View>
      <ChipPicker
        label="Currency"
        options={CURRENCIES}
        value={form.currency}
        onChange={(currency) => update({ currency: currency.toUpperCase() })}
        otherPlaceholder="Code, e.g. JPY"
      />
      <ChipPicker
        label="Product"
        options={PRODUCTS}
        value={form.productId}
        onChange={(productId) => update({ productId })}
        otherPlaceholder="product id"
      />
      <FoldRow title="Start date" summary={startLabel} info={help.startDate}>
        <ChipRow
          values={START_OPTIONS.map(([, label]) => label)}
          selected={startLabel}
          onPick={(label) =>
            update({
              startDaysAgo: START_OPTIONS.find(([, l]) => l === label)![0],
            })
          }
        />
      </FoldRow>
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 12 },
  sendAnyway: { alignItems: 'flex-start', marginLeft: -8 },
});
