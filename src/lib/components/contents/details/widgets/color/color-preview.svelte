<!--
  @component
  Implement the preview for the Color widget.
  @see https://decapcms.org/docs/widgets/#color
-->
<script>
  /**
   * @type {LocaleCode}
   */
  // svelte-ignore unused-export-let
  export let locale;
  /**
   * @type {string}
   */
  // svelte-ignore unused-export-let
  export let keyPath;
  /**
   * @type {ColorField}
   */
  export let fieldConfig;
  /**
   * @type {string}
   */
  export let currentValue;

  $: ({
    // Widget-specific options
    enableAlpha = false,
  } = fieldConfig);

  /**
   * Cast the given hex value to integer.
   * @param {string} hex - Hex value.
   * @returns {number} Integer value.
   */
  const hexToInt = (hex) => Number.parseInt(`0x${hex}`, 16);

  $: rgb = (() => {
    const [, r, g, b, a] =
      currentValue?.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/) ?? [];

    return r
      ? `rgb(${hexToInt(r)} ${hexToInt(g)} ${hexToInt(b)}` +
          `${enableAlpha && a ? ` / ${Math.round((hexToInt(a) / 255) * 100)}%` : ''})`
      : '';
  })();
</script>

{#if typeof currentValue === 'string' && currentValue.trim()}
  <p>
    <span role="none" class="preview">
      <span role="none" class="color" style:background-color={currentValue} />
      <span role="none" class="value">{currentValue}</span>
      <span role="none" class="value">{rgb}</span>
    </span>
  </p>
{/if}

<style lang="scss">
  .preview {
    display: inline-flex;
    align-items: center;
    gap: 8px;

    .color {
      display: block;
      width: 24px;
      height: 24px;
      border-radius: 24px;
    }
  }
</style>
