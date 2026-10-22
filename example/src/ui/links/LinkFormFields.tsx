import { StyleSheet, View } from 'react-native';
import {
  linkMoreSummary,
  linkOverridesSummary,
  SAMPLE_IMAGE_1,
  SAMPLE_IMAGE_2,
  SAMPLE_REDIRECTS,
  type LinkForm,
  type Redirect,
} from '../../data/forms';
import { FoldRow, SwitchRow, TriState } from '../controls/Basics';
import { ChipInput, ChipPicker, ChipRow } from '../controls/Chips';
import { AppTextField, LinkField, SuggestField } from '../controls/Fields';
import { KeyValueRows } from '../controls/KeyValueRows';
import { help } from '../help';

const IMAGE_NAMES: Record<string, string> = {
  '': 'None',
  [SAMPLE_IMAGE_1]: 'Sample 1',
  [SAMPLE_IMAGE_2]: 'Sample 2',
};

export function LinkFormFields({
  form,
  update,
}: {
  form: LinkForm;
  update: (change: Partial<LinkForm>) => void;
}) {
  return (
    <View style={styles.fields}>
      <SuggestField
        label="Title"
        value={form.title}
        onChange={(title) => update({ title })}
        suggestions={[]}
        returnKey="next"
      />
      <SuggestField
        label="Subtitle"
        value={form.subtitle}
        onChange={(subtitle) => update({ subtitle })}
        suggestions={[]}
        returnKey="next"
      />
      <KeyValueRows
        label="Data"
        info={help.linkData}
        rows={form.data}
        onChange={(data) => update({ data })}
        suggestedKeys={['promo', 'user_id', 'screen']}
      />
      <FoldRow title="More options" summary={linkMoreSummary(form)}>
        <View style={styles.fields}>
          <ChipPicker
            label="Image"
            options={['', SAMPLE_IMAGE_1, SAMPLE_IMAGE_2]}
            value={form.imageUrl}
            onChange={(imageUrl) => update({ imageUrl })}
            otherLabel="URL…"
            otherPlaceholder="https://"
            display={(option) => IMAGE_NAMES[option] ?? option}
          />
          <ChipInput
            label="Tags"
            info={help.linkTags}
            values={form.tags}
            onChange={(tags) => update({ tags })}
            placeholder="Add tag"
          />
        </View>
        <SwitchRow
          label="UTM tracking"
          value={form.utmOn}
          onChange={(utmOn) => update({ utmOn })}
          info={help.utm}
        />
        {form.utmOn ? (
          <View style={[styles.row, styles.utm]}>
            <AppTextField
              value={form.utmSource}
              onChange={(utmSource) => update({ utmSource })}
              placeholder="source"
              returnKey="next"
              style={styles.grow}
            />
            <AppTextField
              value={form.utmMedium}
              onChange={(utmMedium) => update({ utmMedium })}
              placeholder="medium"
              returnKey="next"
              style={styles.grow}
            />
            <AppTextField
              value={form.utmCampaign}
              onChange={(utmCampaign) => update({ utmCampaign })}
              placeholder="campaign"
              style={styles.grow}
            />
          </View>
        ) : null}
        <SwitchRow
          label="Custom redirects"
          value={form.redirectsOn}
          onChange={(redirectsOn) => update({ redirectsOn })}
          supporting={form.redirectsOn ? undefined : 'uses project'}
          info={help.customRedirects}
        />
        {form.redirectsOn ? (
          <>
            <RedirectEditor
              platform="Android"
              redirect={form.android}
              onChange={(android) => update({ android })}
            />
            <RedirectEditor
              platform="iOS"
              redirect={form.ios}
              onChange={(ios) => update({ ios })}
            />
            <RedirectEditor
              platform="Desktop"
              redirect={form.desktop}
              onChange={(desktop) => update({ desktop })}
            />
          </>
        ) : null}
        <FoldRow
          title="Platform overrides"
          summary={linkOverridesSummary(form)}
          info={help.platformOverrides}
        >
          <TriState
            label="Preview on Android"
            value={form.previewAndroid}
            onChange={(previewAndroid) => update({ previewAndroid })}
          />
          <TriState
            label="Preview on iOS"
            value={form.previewIos}
            onChange={(previewIos) => update({ previewIos })}
          />
          <TriState
            label="Clipboard on Android"
            value={form.clipboardAndroid}
            onChange={(clipboardAndroid) => update({ clipboardAndroid })}
          />
          <TriState
            label="Clipboard on iOS"
            value={form.clipboardIos}
            onChange={(clipboardIos) => update({ clipboardIos })}
          />
        </FoldRow>
      </FoldRow>
    </View>
  );
}

function RedirectEditor({
  platform,
  redirect,
  onChange,
}: {
  platform: string;
  redirect: Redirect;
  onChange: (redirect: Redirect) => void;
}) {
  return (
    <View style={styles.redirect}>
      <LinkField
        label={platform}
        value={redirect.url}
        onChange={(url) => onChange({ ...redirect, url })}
      />
      <View style={styles.redirectChips}>
        <ChipRow
          values={SAMPLE_REDIRECTS}
          selected={redirect.url}
          onPick={(url) => onChange({ ...redirect, url })}
        />
      </View>
      <SwitchRow
        label="Open app if installed"
        value={redirect.openAppIfInstalled}
        onChange={(openAppIfInstalled) =>
          onChange({ ...redirect, openAppIfInstalled })
        }
        showDivider={false}
        info={help.openAppIfInstalled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1 },
  utm: { gap: 5, paddingVertical: 6 },
  redirect: { paddingTop: 6 },
  redirectChips: { paddingTop: 6 },
});
