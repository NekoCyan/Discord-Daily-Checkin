import {
  ButtonBuilder,
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from 'discord.js';

type TextDisplayContentType = string | string | ButtonBuilder | undefined;
export function TextDisplay(
  container: ContainerBuilder,
  _content: TextDisplayContentType | TextDisplayContentType[],
  thumbnailUrl?: string,
) {
  const rawContent = Array.isArray(_content) ? _content : [_content];
  // Filter out undefined content, and keep the order of the rest content.
  const content = rawContent.filter((x) => x);
  // If there is no valid content, return the container as is.
  if (content.length === 0) return container;

  // Filter the textContent to only include string content for TextDisplayBuilder.
  const textDisplays = content
    .filter((x) => typeof x === 'string')
    .map((c) => new TextDisplayBuilder().setContent(c));

  // If there are ButtonBuilder instances in content, add the first one as button accessory.
  const buttonAccessory = content.find((x) => x instanceof ButtonBuilder) as
    | ButtonBuilder
    | undefined;

  /**
   * SectionBuilder requires an accessory (ButtonBuilder or ThumbnailBuilder).
   * If neither is present, add text displays directly to the container instead.
   */
  const hasAccessory = buttonAccessory !== undefined || thumbnailUrl !== undefined;
  if (!hasAccessory) {
    if (textDisplays.length > 0) return container.addTextDisplayComponents(...textDisplays);
    return container;
  }

  const section = new SectionBuilder();
  if (textDisplays.length > 0) section.addTextDisplayComponents(...textDisplays);
  if (buttonAccessory) section.setButtonAccessory(buttonAccessory);

  // If there is a thumbnail URL, set it as thumbnail accessory.
  if (thumbnailUrl) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailUrl));

  return container.addSectionComponents(section);
}

export function Separator(container: ContainerBuilder) {
  return container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );
}
