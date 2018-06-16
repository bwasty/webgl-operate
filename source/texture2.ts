
import { assert } from './auxiliaries';
import { byteSizeOfFormat } from './formatbytesizes';
import { GLsizei2 } from './tuples';

import { Bindable } from './bindable';
import { TexImage2DData } from './gl2facade';
import { Initializable } from './initializable';
import { AbstractObject } from './object';


/**
 * Wrapper for an WebGL 2D texture providing size accessors and requiring for bind, unbind, resize, validity, and
 * initialization implementations. The texture object is created on initialization and deleted on uninitialization.
 * After being initialized, the texture can be resized, reformated, and data can set directly or via load:
 * ```
 * const texture = new Texture2(context, 'Texture');
 * texture.initialize(1, 1, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE);
 * texture.load('/img/webgl-operate-logo.png', true)
 * ```
 */
export class Texture2 extends AbstractObject<WebGLTexture> implements Bindable {

    /**
     * Default texture, e.g., used for unbind.
     */
    // tslint:disable-next-line:no-null-keyword
    static readonly DEFAULT_TEXTURE = null;

    /** @see {@link width} */
    protected _width: GLsizei = 0;

    /** @see {@link height} */
    protected _height: GLsizei = 0;

    /** @see {@link internalFormat} */
    protected _internalFormat: GLenum = 0;

    /** @see {@link format} */
    protected _format: GLenum = 0;

    /** @see {@link type} */
    protected _type: GLenum = 0;


    /**
     * Create a texture object on the GPU.
     * @param width - Initial width of the texture in px.
     * @param height - Initial height of the texture in px.
     * @param internalFormat - Internal format of the texture object.
     * @param format - Format of the texture data even though no data is passed.
     * @param type - Data type of the texel data.
     */
    protected create(width: GLsizei, height: GLsizei, internalFormat: GLenum,
        format: GLenum, type: GLenum): WebGLTexture | null {

        assert(width > 0 && height > 0, `texture requires valid width and height of greater than zero`);
        const gl = this._context.gl;
        const gl2facade = this._context.gl2facade;

        this._object = gl.createTexture();

        this._width = width;
        this._height = height;
        this._internalFormat = internalFormat;
        this._format = format;
        this._type = type;

        gl.bindTexture(gl.TEXTURE_2D, this._object);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl2facade.texImage2D(gl.TEXTURE_2D, 0, this._internalFormat,
            this._width, this._height, 0, this._format, this._type);

        gl.bindTexture(gl.TEXTURE_2D, Texture2.DEFAULT_TEXTURE);
        /* note that gl.isTexture requires the texture to be bound */
        this._valid = gl.isTexture(this._object);
        this.context.allocationRegister.reallocate(this._identifier, 0);

        return this._object;
    }

    /**
     * Delete the texture object on the GPU. This should have the reverse effect of `create`.
     */
    protected delete(): void {
        assert(this._object instanceof WebGLTexture, `expected WebGLTexture object`);
        this._context.gl.deleteTexture(this._object);

        // tslint:disable-next-line:no-null-keyword
        this._object = null;
        this._valid = false;

        this._internalFormat = 0;
        this._format = 0;
        this._type = 0;

        this._width = 0;
        this._height = 0;
    }

    /**
     * Bind the texture object to a texture unit.
     */
    @Initializable.assert_initialized()
    bind(unit?: GLenum): void {
        const gl = this.context.gl;
        if (unit) {
            gl.activeTexture(unit);
        }
        gl.bindTexture(gl.TEXTURE_2D, this._object);
    }

    /**
     * Unbind the texture object from a texture unit.
     */
    @Initializable.assert_initialized()
    unbind(unit?: GLenum): void {
        const gl = this.context.gl;
        if (unit) {
            gl.activeTexture(unit);
        }
        gl.bindTexture(gl.TEXTURE_2D, Texture2.DEFAULT_TEXTURE);
    }

    /**
     * Asynchronous load of an image via URI or data URI.
     * @param uri - URI linking the image that should be loaded. Data URI is also supported.
     * @param crossOrigin - Enable cross origin data loading.
     * @returns - Promise for handling image load status.
     */
    @Initializable.assert_initialized()
    load(uri: string, crossOrigin: boolean = false): Promise<void> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onerror = () => reject();

            image.onload = () => {
                this.resize(image.width, image.height);
                this.data(image);
                resolve();
            };

            if (crossOrigin) {
                image.crossOrigin = 'anonymous';
            }
            image.src = uri;
        });
    }

    /**
     * Pass image data to the texture object.
     * @param data - Texel data that will be copied into the objects data store.
     * @param bind - Allows to skip binding the texture (e.g., when binding is handled outside).
     * @param unbind - Allows to skip unbinding the texture (e.g., when binding is handled outside).
     */
    @Initializable.assert_initialized()
    data(data: TexImage2DData, bind: boolean = true, unbind: boolean = true): void {
        const gl = this.context.gl;
        const gl2facade = this._context.gl2facade;

        if (bind) {
            this.bind();
        }

        gl2facade.texImage2D(gl.TEXTURE_2D, 0, this._internalFormat,
            this._width, this._height, 0, this._format, this._type, data);

        if (unbind) {
            this.unbind();
        }

        let bytes: GLsizei = 0;
        // update allocated bytes
        if (data !== undefined) {

            bytes = this._width * this._height * byteSizeOfFormat(this.context, this._internalFormat as GLenum);
            // Fix in case of implicit float and half-float texture generation (e.g., in webgl with half_float support).
            if (this._type === this.context.gl2facade.HALF_FLOAT && this._internalFormat !== this.context.gl2.RGBA16F) {
                bytes *= 2;
            } else if (this._type === this.context.gl.FLOAT && this._internalFormat !== this.context.gl2.RGBA16F) {
                bytes *= 4;
            }
        }
        this.context.allocationRegister.reallocate(this._identifier, bytes);
    }

    /**
     * Sets the texture object's magnification and minification filter.
     * @param mag - Value for the TEXTURE_MAG_FILTER parameter.
     * @param min - Value for the TEXTURE_MIN_FILTER parameter.
     * @param bind - Allows to skip binding the texture (e.g., when binding is handled outside).
     * @param unbind - Allows to skip unbinding the texture (e.g., when binding is handled outside).
     */
    @Initializable.assert_initialized()
    filter(mag: GLenum, min: GLenum, bind: boolean = true, unbind: boolean = true): void {
        const gl = this.context.gl;

        if (bind) {
            this.bind();
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mag);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min);
        if (unbind) {
            this.unbind();
        }
    }

    /**
     * Sets the texture object's wrapping function for s and t coordinates.
     * @param wrap_s - Value for the TEXTURE_WRAP_S parameter.
     * @param wrap_t - Value for the TEXTURE_WRAP_T parameter.
     * @param bind - Allows to skip binding the texture (e.g., when binding is handled outside).
     * @param unbind - Allows to skip unbinding the texture (e.g., when binding is handled outside).
     */
    @Initializable.assert_initialized()
    /* tslint:disable-next-line:variable-name */
    wrap(wrap_s: GLenum, wrap_t: GLenum, bind: boolean = true, unbind: boolean = true): void {
        const gl = this.context.gl;

        if (bind) {
            this.bind();
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap_s);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap_t);
        if (unbind) {
            this.unbind();
        }
    }

    /**
     * This can be used to reformat the texture image without creating a new texture object. Please note that this
     * resets the texture's image data to undefined. @see {@link data} for setting new image data.
     * @param internalFormat - Internal format of the texture object.
     * @param format - Format of the texture data even though no data is passed.
     * @param type - Data type of the texel data.
     * @param bind - Allows to skip binding the texture (e.g., when binding is handled outside).
     * @param unbind - Allows to skip unbinding the texture (e.g., when binding is handled outside).
     */
    @Initializable.assert_initialized()
    reformat(internalFormat: GLenum, format?: GLenum, type?: GLenum,
        bind: boolean = true, unbind: boolean = true): void {

        if (internalFormat === this._internalFormat
            && (format === undefined || format === this._format)
            && (type === undefined || type === this._type)) {
            return;
        }
        assert(internalFormat !== undefined, `valid internal format expected`);
        this._internalFormat = internalFormat;

        if (format) {
            this._format = format;
        }
        if (type) {
            this._type = type;
        }

        this.data(undefined, bind, unbind);
    }

    /**
     * This should be used to implement efficient resize the texture.
     * @param width - Targeted/new width of the texture in px.
     * @param height - Targeted/new height of the texture in px.
     * @param bind - Allows to skip binding the texture (e.g., when binding is handled outside).
     * @param unbind - Allows to skip unbinding the texture (e.g., when binding is handled outside).
     */
    @Initializable.assert_initialized()
    resize(width: GLsizei, height: GLsizei, bind: boolean = true, unbind: boolean = true): void {
        if (width === this._width && height === this._height) {
            return;
        }
        this._width = width;
        this._height = height;

        this.data(undefined, bind, unbind);
    }

    /**
     * Returns the number of bytes this object approximately allocates on the GPU. The size will be zero when no
     * image data was passed to the texture object.
     */
    get bytes(): GLsizei {
        this.assertInitialized();
        return this.context.allocationRegister.allocated(this._identifier);
    }

    /**
     * Cached internal format of the texture for efficient resize. This can only be changed by re-initialization.
     */
    get internalFormat(): GLenum {
        this.assertInitialized();
        return this._internalFormat as GLenum;
    }

    /**
     * Cached format of the data provided to the texture object for efficient resize. This is set on initialization and
     * might change on data transfers.
     */
    get format(): GLenum {
        this.assertInitialized();
        return this._format as GLenum;
    }

    /**
     * Cached type of the data provided to the texture used for efficient resize. This is set on initialization and
     * might change on data transfers.
     */
    get type(): GLenum {
        this.assertInitialized();
        return this._type as GLenum;
    }

    /**
     * The width of the texture object.
     */
    get width(): GLsizei {
        this.assertInitialized();
        return this._width;
    }

    /**
     * The height of the texture object.
     */
    get height(): GLsizei {
        this.assertInitialized();
        return this._height;
    }

    /**
     * Convenience getter for the 2-tuple containing width and height.
     * @see {@link width}
     * @see {@link heigth}
     */
    get size(): GLsizei2 {
        return [this.width, this.height];
    }

}
