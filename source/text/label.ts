
import { mat4, vec3 } from 'gl-matrix';

import { ChangeLookup } from '../changelookup';
import { Color } from '../color';

import { FontFace } from './fontface';
import { GlyphVertices } from './glyphvertices';
import { Text } from './text';


/**
 * Object comprising a text reference, a font face, and additional typographic information for type setting, rendering,
 * and interaction. Multiple labels might reference the same text, but could be placed at different locations or
 * rendered applying different font faces, styles etc.
 */
export class Label {

    private static readonly DEFAULT_ELLIPSIS = '...';


    /** @see {@link text} */
    protected _text: Text;

    /** @see {@link alignment} */
    protected _alignment: Label.Alignment = Label.Alignment.Left;

    /** @see {@link lineAnchor} */
    protected _lineAnchor: Label.LineAnchor = Label.LineAnchor.Baseline;

    /** @see {@link lineWidth} */
    protected _lineWidth = NaN;

    /** @see {@link fontSize} */
    protected _fontSize = 0.05;

    /** @see {@link fontSizeUnit} */
    protected _fontSizeUnit: Label.SpaceUnit = Label.SpaceUnit.World;

    /** @see {@link fontFace} */
    protected _fontFace: FontFace | undefined;

    /** @see {@link color} */
    protected _color: Color;

    /** @see {@link background} */
    protected _backgroundColor: Color;

    /** @see {@link type} */
    protected _type: Label.Type;

    /** @see {@link transform} */
    protected _staticTransform: mat4;

    /** @see {@link dynamicTransform} */
    protected _dynamicTransform: mat4;

    /** @see {@link extent} */
    protected _extent: [number, number];


    /** @see {@link altered} */
    protected readonly _altered = Object.assign(new ChangeLookup(), {
        any: false, color: false, resources: false, text: false, typesetting: false,
        staticTransform: false, dynamicTransform: false,
    });


    /** @see {@link wrap} */
    protected _wrap = false;

    /** @see {@link elide} */
    protected _elide: Label.Elide = Label.Elide.None;

    /** @see {@link ellipsis} */
    protected _ellipsis: string = Label.DEFAULT_ELLIPSIS;


    /**
     * Constructs an unconfigured, empty label.
     * @param text - The text that is displayed by this label.
     * @param fontFace - The font face that should be used for that label, or undefined if set later.
     */
    constructor(text: Text, type: Label.Type, fontFace?: FontFace) {
        this._text = text;
        this._type = type;

        this._staticTransform = mat4.create();
        this._dynamicTransform = mat4.create();
        this._extent = [0, 0];

        if (fontFace) {
            this._fontFace = fontFace;
        }
    }

    /**
     * Creates an Array of glyph vertices, ready to be used in the Typesetter.
     */
    protected prepareVertexStorage(): GlyphVertices {
        const vertices = new GlyphVertices(this.length + this.ellipsis.length);
        return vertices;
    }

    /**
     * Returns the character at the specified index.
     * @param index - The zero-based index of the desired character.
     * @returns character at the specified index
     */
    charAt(index: number): string {
        return this._text.charAt(index);
    }

    /**
     * Returns the Unicode value (codepoint) of the character at the specified location.
     * @param index - The zero-based index of the desired character. If there is no character at the specified index,
     * NaN is returned.
     * @returns - codepoint of the char at given index or NaN
     */
    charCodeAt(index: number): number {
        return this._text.charCodeAt(index);
    }

    /**
     * Returns, whether or not the character at a given index is equal to the default or the text's line feed character.
     * @param index - The zero-based index of the desired character. If there is no character at the specified index,
     * NaN is returned.
     * @returns - true if char at given index equals the text's line feed character
     */
    lineFeedAt(index: number): boolean {
        return this.charAt(index) === this.lineFeed;
    }


    /**
     * Gets the kerning value before (i.e., left in left-to-right writing systems) the given glyph index.
     * @param index - index of the glyph in this label
     * @returns - kerning value before glyph at given index
     */
    kerningBefore(index: number): number {
        if (index < 1 || index > this.length) {
            return NaN;
        }
        return this._fontFace!.kerning(this.charCodeAt(index - 1), this.charCodeAt(index));
    }

    /**
     * Gets the kerning value after (i.e., right in left-to-right writing systems) the given glyph index.
     * @param index - index of the glyph in this label
     * @returns - kerning value after glyph at given index
     */
    kerningAfter(index: number): number {
        if (index < 0 || index > this.length - 1) {
            return NaN;
        }
        return this._fontFace!.kerning(this.charCodeAt(index), this.charCodeAt(index + 1));
    }

    /**
     * Returns the advancement of the glyph at given index.
     * @param index - The zero-based index of the desired character. If there is no character at the specified index,
     * NaN is returned.
     * @returns - advancement of the glyph at given index or NaN
     */
    advance(index: number): number {
        if (index < 0 || index > this.length) {
            return NaN;
        }
        return this._fontFace!.glyph(this.charCodeAt(index)).advance;
    }

    /**
     * Convenience getter to the label's text as string.
     * @returns the label's text as string
     */
    toString(): string {
        if (this._text instanceof Text) {
            return this._text.text;
        }
        return this._text;
    }

    /**
     * Intended for resetting alteration status.
     */
    reset(): void {
        this._altered.reset();
    }


    /**
     * Text that is to be rendered.
     */
    set text(text: Text) {
        this._altered.alter('text');
        this._text = text;
    }
    get text(): Text {
        return this._text;
    }

    /**
     * Read-only access to this labels type specified at construction time. Static labels are baking as much
     * transformations as possible into the glyph vertices (used for GPU). This means, when the position or size
     * changes, the label must be typeset again and vertices are fully re-computed. For dynamic labels, only most
     * relevant transformations are applied and dynamic transformations such as rotation, translation, scale etc,
     * are applied during rendering without requiring re-typesetting or re-computation of vertices. The type,
     * however, does not relate to the text. Whenever the text changes, re-typesetting etc. have to be invoked.
     */
    get type(): Label.Type {
        return this._type;
    }

    /**
     * Length of the text, i.e., number of characters within the text.
     */
    get length(): number {
        return this._text.length;
    }

    /**
     * Character that is to be used for Line feed.
     */
    get lineFeed(): string {
        if (this._text instanceof Text) {
            return this._text.lineFeed;
        }
        return Text.DEFAULT_LINE_FEED;
    }

    /**
     * If enabled, breaks lines automatically at line width (while typesetting). Note that elide mode takes precedence.
     */
    set wrap(flag: boolean) {
        this._wrap = flag;
    }
    get wrap(): boolean {
        return this._wrap;
    }

    /**
     * If enabled, shrinks the label to line width. Depending on the elide mode, the ellipses is put left, middle, or
     * right. The ellipsis string can be adjusted (@see {@link ellipsis}). If the labels text does not exceed the line
     * width no elide will be applied.
     */
    set elide(elide: Label.Elide) {
        this._elide = elide;
    }
    get elide(): Label.Elide {
        return this._elide;
    }

    /**
     * Allows to override/customize the ellipsis string used for text elide (@see {@link elide}).
     */
    set ellipsis(ellipsis: string) {
        this._ellipsis = ellipsis;
    }
    get ellipsis(): string {
        return this._ellipsis;
    }

    /**
     * Line width used to either maximum length for elide or maximum length for line breaks due to word wrap. The line
     * width is expected in typesetting space (the unit used while Typesetting, i.e., the unit as the font face's glyph
     * texture atlas).
     */
    set lineWidth(lineWidth: number) {
        this._lineWidth = lineWidth;
    }

    /**
     * Width of a single line in typesetting space (the unit used while Typesetting, i.e., the unit as the font face's
     * glyph texture atlas). Since the font face needs to be defined in order to typeset, we assume here that the label
     * has a defined fontFace.
     */
    get lineWidth(): number {
        /* this.fontSize and lineWidth use the same unit (i.e., this.fontSizeUnit),
         * this._lineWidth is expected to be in the same unit as the fontFace's glyph texture atlas */
        return this._lineWidth * this._fontFace!.size / this.fontSize;
    }

    /**
     * Horizontal text alignment for typesetting.
     */
    set alignment(alignment: Label.Alignment) {
        if (this._alignment === alignment) {
            return;
        }
        this._altered.alter('typesetting');
        this._alignment = alignment;
    }
    get alignment(): Label.Alignment {
        return this._alignment;
    }

    /**
     * Vertical text anchor point used for positional reference.
     */
    set lineAnchor(anchor: Label.LineAnchor) {
        if (this._lineAnchor === anchor) {
            return;
        }
        this._altered.alter('typesetting');
        this._lineAnchor = anchor;
    }
    get lineAnchor(): Label.LineAnchor {
        return this._lineAnchor;
    }


    /**
     * The currently used font size.
     * (@see {@link fontSizeUnit})
     */
    set fontSize(newSize: number) {
        if (this._fontSize === newSize) {
            return;
        }
        this._altered.alter('typesetting');
        this._altered.alter('transform');
        this._fontSize = newSize;
    }
    get fontSize(): number {
        return this._fontSize;
    }

    /**
     * This unit is used for the font size.
     * (@see {@link fontSize})
     */
    set fontSizeUnit(newUnit: Label.SpaceUnit) {
        if (this._fontSizeUnit === newUnit) {
            return;
        }
        this._altered.alter('typesetting');
        this._altered.alter('transform');
        this._fontSizeUnit = newUnit;
    }
    get fontSizeUnit(): Label.SpaceUnit {
        return this._fontSizeUnit;
    }

    /**
     * Font face used for typesetting, transformation, and rendering. The font face is usually set by the
     * LabelRenderPass.
     */
    set fontFace(fontFace: FontFace | undefined) {
        if (this._fontFace === fontFace) {
            return;
        }
        this._altered.alter('typesetting');
        this._altered.alter('resources');
        this._fontFace = fontFace;
    }
    get fontFace(): FontFace | undefined {
        return this._fontFace;
    }

    /**
     * Color used for text rendering.
     */
    set color(color: Color) {
        if (this._color.equals(color)) {
            return;
        }
        this._altered.alter('color');
        this._color = color;
    }
    get color(): Color {
        return this._color;
    }

    /**
     * Color used for background of text rendering.
     */
    set backgroundColor(color: Color) {
        if (this._backgroundColor.equals(color)) {
            return;
        }
        this._altered.alter('color');
        this._backgroundColor = color;
    }
    get backgroundColor(): Color {
        return this._backgroundColor;
    }


    /**
     * Transformation used to move, scale, rotate, skew, etc. the label into an arbitrary coordinate space (e.g.,
     * screen space, world space, ...). This can be set either explicitly or implicitly using various transformation
     * utility functions.
     */
    set staticTransform(transform: mat4) {
        if (mat4.equals(this._staticTransform, transform)) {
            return;
        }
        this._altered.alter('staticTransform');
        this._staticTransform = transform;
    }
    get staticTransform(): mat4 {

        const s = this.fontSize / this._fontFace!.size;

        const t: mat4 = mat4.create();
        mat4.scale(t, this._staticTransform, vec3.fromValues(s, s, s));

        return t;
    }

    /**
     * Stores the resulting dynamic transform. This is intended to be used when in dynamic mode.
     * (e.g., for calculations to the final transform).
     */
    set dynamicTransform(t: mat4) {
        this._altered.alter('dynamicTransform');
        this._dynamicTransform = t;
    }
    get dynamicTransform(): mat4 {
        return this._dynamicTransform;
    }

    /**
     * The typesetter sets this extent after typesetting and applying the transform.
     */
    set extent(e: [number, number]) {
        this._extent = e;
    }
    /**
     * Returns the width and height of the typset label. Both are zero if not typeset yet.
     */
    get extent(): [number, number] {
        return this._extent;
    }

    /*
    * Whether or not any property or the referenced text has changed requiring, e.g., the new typesetting.
    * The alteration status can be reset using `reset` (@see {@link reset}).
    */
    get altered(): boolean {
        return this._altered.any || (this._text instanceof Text ? this._text.altered : false);
    }

}

export namespace Label {

    export enum Type {
        Static = 'static',
        Dynamic = 'dynamic',
    }

    export enum Elide {
        None = 'none',
        Left = 'left',
        Middle = 'middle',
        Right = 'right',
    }

    export enum Alignment {
        Left = 'left',
        Center = 'center',
        Right = 'right',
    }

    export enum LineAnchor {
        Top = 'top',
        Ascent = 'ascent',
        Center = 'center',
        Baseline = 'baseline',
        Descent = 'descent',
        Bottom = 'bottom',
    }

    /**
     * This unit is used for the font size and related calculations.
     */
    export enum SpaceUnit {
        /* abstract world unit */
        World = 'world',
        /* screen pixel */
        Px = 'px',
        /** @todo Pt for point unit */
    }

}
