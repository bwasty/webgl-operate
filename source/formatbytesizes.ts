
import { assert } from './auxiliaries';

import { Context } from './context';


/**
 * Provides the size in bytes of certain WebGL format enumerator. Please note that some byte sizes might vary based on
 * context attributes or the bound render, thus, DEPTH_COMPONENT and DEPTH_STENCIL are not covered by this function.
 * This function does NOT cover data types that are usually on CPU side, not GPU, e.g., UNSIGNED_BYTE,
 * UNSIGNED_SHORT_5_6_5, HALF_FLOAT, UNSIGNED_SHORT, FLOAT, etc. and will assert when provided with types.
 * @param context - The OpenGL context.
 * @param format - Format identifier of the target internal OpenGL data type.
 * @return - The size in bytes of one type instance on the GPU.
 */
export function byteSizeOfFormat(context: Context, format: GLenum): number {
    const gl = context.gl;
    const gl2 = context.gl2;
    const gl2facade = context.gl2facade;


    const UNSIGNED_INT_24_8_WEBGL = context.supportsDepthTexture ?
        context.depthTexture.UNSIGNED_INT_24_8_WEBGL : undefined;

    switch (format) {
        case undefined: // must be first, in case any other format is not defined
            break;
        default:
            break;

        case gl.UNSIGNED_BYTE:
        case gl.UNSIGNED_SHORT_5_6_5:
        case gl.UNSIGNED_SHORT_4_4_4_4:
        case gl.UNSIGNED_SHORT_5_5_5_1:
        case gl.UNSIGNED_SHORT:
        case gl.UNSIGNED_INT:
        case UNSIGNED_INT_24_8_WEBGL:
        case gl.FLOAT:
        case gl2facade.HALF_FLOAT:
        case gl.BYTE:
        case gl.UNSIGNED_SHORT:
        case gl.SHORT:
        case gl.UNSIGNED_INT:
        case gl.INT:
        case gl2.HALF_FLOAT:
        case gl.FLOAT:
        case gl2.UNSIGNED_INT_2_10_10_10_REV:
        case gl2.UNSIGNED_INT_10F_11F_11F_REV:
        case gl2.UNSIGNED_INT_5_9_9_9_REV:
        case gl2.UNSIGNED_INT_24_8:
        case gl2.FLOAT_32_UNSIGNED_INT_24_8_REV:
            assert(false, `expected format instead of type ${format}`);
            return 0;
    }


    const SRGB8_ALPHA8_EXT = context.supportsSRGB ? context.sRGB.SRGB8_ALPHA8_EXT : undefined;
    const SRGB_EXT = context.supportsSRGB ? context.sRGB.SRGB_EXT : undefined;
    const SRGB_ALPHA_EXT = context.supportsSRGB ? context.sRGB.SRGB_ALPHA_EXT : undefined;

    const RGB32F_EXT = context.supportsColorBufferFloat ? context.colorBufferFloat.RGB32F_EXT : undefined;
    const RGBA32F_EXT = context.supportsColorBufferFloat ? context.colorBufferFloat.RGBA32F_EXT : undefined;

    switch (format) {
        case undefined: // must be first, in case any other format is not defined
        /* falls through */
        default:
            assert(false, `size of format ${format} is unknown`);
            return 0;

        case gl.ALPHA:
        case gl.LUMINANCE:
        case gl2.R8:
        case gl2.R8I:
        case gl2.R8UI:
        case gl.STENCIL_INDEX8:
            return 1;

        case gl.DEPTH_COMPONENT16:
        case gl.LUMINANCE_ALPHA:
        case gl2.R16F:
        case gl2.R16I:
        case gl2.R16UI:
        case gl2.RG8:
        case gl2.RG8I:
        case gl2.RG8UI:
        case gl.RGB565:
        case gl.RGB5_A1:
        case gl.RGBA4:
            return 2;

        case gl2.DEPTH_COMPONENT24:
        case gl2.RGB:
        case gl2.RGB8:
        case gl2.RGB8UI:
        case gl2.SRGB:
        case SRGB_EXT:
        case gl2.SRGB8:
            return 3;

        case gl.DEPTH_STENCIL:
        case gl2.DEPTH24_STENCIL8:
        case gl2.DEPTH_COMPONENT32F:
        case gl2.R11F_G11F_B10F:
        case gl2.R32F:
        case gl2.R32I:
        case gl2.R32UI:
        case gl2.RG16F:
        case gl2.RG16I:
        case gl2.RG16UI:
        case gl2.RGB10_A2:
        case gl2.RGB10_A2UI:
        case gl2.RGB9_E5:
        case gl.RGBA:
        case gl2.RGBA8:
        case gl2.RGBA8I:
        case gl2.RGBA8UI:
        case gl2.SRGB8_ALPHA8:
        case SRGB8_ALPHA8_EXT:
        case (gl as any).SRGB_ALPHA:
        case SRGB_ALPHA_EXT:
        case (gl as any).SRGB_ALPHA8:
        // https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/texStorage2D
        case (gl as any).SRGB_APLHA8:
            return 4;

        case gl2.DEPTH32F_STENCIL8:
            return 5;

        case gl2.RGB16F:
            return 6;

        case gl2.RG32F:
        case gl2.RG32I:
        case gl2.RG32UI:
        case gl2.RGBA16F:
        case gl2.RGBA16I:
        case gl2.RGBA16UI:
            return 8;

        case gl2.RGB32F:
        case gl2.RGB32F:
        case RGB32F_EXT:
            return 12;

        case gl2.RGBA32F:
        case RGBA32F_EXT:
        case gl2.RGBA32I:
        case gl2.RGBA32UI:
            return 16;

        case gl.DEPTH_COMPONENT:
        case gl.DEPTH_STENCIL:
            assert(false, `byte size of DEPTH_COMPONENT or DEPTH_STENCIL formats depends on active render buffer`);
            return 0;
    }
}
