import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { EaseView } from '../EaseView';

// The native component is mocked by react-native's jest preset as a host View.
// We inspect the props passed to it to verify JS-level resolution.

function getNativeProps() {
  // The NativeEaseView renders as a plain <View> in tests.
  // Access props via the testID on the wrapper.
  const view = screen.getByTestId('ease');
  return view.props;
}

describe('EaseView', () => {
  describe('animate prop resolution', () => {
    it('applies identity defaults when animate is empty', () => {
      render(<EaseView testID="ease" />);
      const props = getNativeProps();
      expect(props.animateOpacity).toBe(1);
      expect(props.animateTranslateX).toBe(0);
      expect(props.animateTranslateY).toBe(0);
      expect(props.animateScaleX).toBe(1);
      expect(props.animateScaleY).toBe(1);
      expect(props.animateRotate).toBe(0);
      expect(props.animateRotateX).toBe(0);
      expect(props.animateRotateY).toBe(0);
    });

    it('passes through animate values', () => {
      render(
        <EaseView
          testID="ease"
          animate={{ opacity: 0.5, translateX: 100, scale: 2 }}
        />,
      );
      const props = getNativeProps();
      expect(props.animateOpacity).toBe(0.5);
      expect(props.animateTranslateX).toBe(100);
      expect(props.animateScaleX).toBe(2);
      expect(props.animateScaleY).toBe(2);
      // Unspecified properties stay at identity
      expect(props.animateTranslateY).toBe(0);
      expect(props.animateRotate).toBe(0);
    });

    it('resolves scale shorthand to scaleX and scaleY', () => {
      render(<EaseView testID="ease" animate={{ scale: 1.5 }} />);
      const props = getNativeProps();
      expect(props.animateScaleX).toBe(1.5);
      expect(props.animateScaleY).toBe(1.5);
    });

    it('allows scaleX/scaleY to override scale', () => {
      render(<EaseView testID="ease" animate={{ scale: 1.2, scaleX: 0.5 }} />);
      const props = getNativeProps();
      expect(props.animateScaleX).toBe(0.5);
      expect(props.animateScaleY).toBe(1.2);
    });

    it('passes rotateX and rotateY', () => {
      render(<EaseView testID="ease" animate={{ rotateX: 45, rotateY: 90 }} />);
      const props = getNativeProps();
      expect(props.animateRotateX).toBe(45);
      expect(props.animateRotateY).toBe(90);
    });

    it('sets animatedProperties bitmask for animated keys only', () => {
      render(
        <EaseView testID="ease" animate={{ opacity: 0.5, translateX: 100 }} />,
      );
      const props = getNativeProps();
      // opacity = 1<<0 = 1, translateX = 1<<1 = 2 → 3
      expect(props.animatedProperties).toBe(3);
    });

    it('sets animatedProperties to 0 when animate is empty', () => {
      render(<EaseView testID="ease" />);
      expect(getNativeProps().animatedProperties).toBe(0);
    });

    it('includes scale shorthand in bitmask as scaleX + scaleY', () => {
      render(<EaseView testID="ease" animate={{ scale: 2 }} />);
      // scaleX = 1<<3 = 8, scaleY = 1<<4 = 16 → 24
      expect(getNativeProps().animatedProperties).toBe(24);
    });
  });

  describe('initialAnimate resolution', () => {
    it('falls back to animate when initialAnimate is not set', () => {
      render(
        <EaseView testID="ease" animate={{ opacity: 0.5, translateY: 50 }} />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateOpacity).toBe(0.5);
      expect(props.initialAnimateTranslateY).toBe(50);
    });

    it('uses initialAnimate when provided', () => {
      render(
        <EaseView
          testID="ease"
          initialAnimate={{ opacity: 0, translateY: 100 }}
          animate={{ opacity: 1, translateY: 0 }}
        />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateOpacity).toBe(0);
      expect(props.initialAnimateTranslateY).toBe(100);
      expect(props.animateOpacity).toBe(1);
      expect(props.animateTranslateY).toBe(0);
    });

    it('fills identity values for unspecified initialAnimate properties', () => {
      render(
        <EaseView
          testID="ease"
          initialAnimate={{ opacity: 0 }}
          animate={{ opacity: 1, scale: 2 }}
        />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateOpacity).toBe(0);
      expect(props.initialAnimateScaleX).toBe(1);
      expect(props.initialAnimateScaleY).toBe(1);
    });

    it('does not forward exit prop to native component', () => {
      render(
        <EaseView
          testID="ease"
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />,
      );
      const props = getNativeProps();
      expect(props.exit).toBeUndefined();
      expect(props.animateOpacity).toBe(1);
    });
  });

  describe('transition defaults', () => {
    it('uses timing default for all properties when no transition', () => {
      render(<EaseView testID="ease" />);
      const t = getNativeProps().transitions;
      expect(t.defaultConfig.type).toBe('timing');
      expect(t.defaultConfig.duration).toBe(300);
      expect(t.defaultConfig.easingBezier).toEqual([0.42, 0, 0.58, 1]);
      expect(t.defaultConfig.loop).toBe('none');
      expect(t.defaultConfig.delay).toBe(0);
      // No category overrides
      expect(t.opacity).toBeUndefined();
      expect(t.transform).toBeUndefined();
      expect(t.borderRadius).toBeUndefined();
      expect(t.backgroundColor).toBeUndefined();
    });

    it('resolves timing transition to defaultConfig only', () => {
      render(
        <EaseView
          testID="ease"
          transition={{
            type: 'timing',
            duration: 500,
            easing: 'linear',
            loop: 'reverse',
          }}
        />,
      );
      const t = getNativeProps().transitions;
      expect(t.defaultConfig.type).toBe('timing');
      expect(t.defaultConfig.duration).toBe(500);
      expect(t.defaultConfig.easingBezier).toEqual([0, 0, 1, 1]);
      expect(t.defaultConfig.loop).toBe('reverse');
      // No category overrides — native falls back to defaultConfig
      expect(t.opacity).toBeUndefined();
      expect(t.transform).toBeUndefined();
    });

    it('resolves spring transition with defaults for unused fields', () => {
      render(
        <EaseView
          testID="ease"
          transition={{ type: 'spring', damping: 20, stiffness: 200, mass: 2 }}
        />,
      );
      const t = getNativeProps().transitions;
      expect(t.defaultConfig.type).toBe('spring');
      expect(t.defaultConfig.damping).toBe(20);
      expect(t.defaultConfig.stiffness).toBe(200);
      expect(t.defaultConfig.mass).toBe(2);
      // Timing-specific fields get defaults
      expect(t.defaultConfig.duration).toBe(300);
      expect(t.defaultConfig.easingBezier).toEqual([0.42, 0, 0.58, 1]);
      expect(t.defaultConfig.loop).toBe('none');
    });

    it('uses spring defaults when only type is specified', () => {
      render(<EaseView testID="ease" transition={{ type: 'spring' }} />);
      const t = getNativeProps().transitions;
      expect(t.defaultConfig.damping).toBe(15);
      expect(t.defaultConfig.stiffness).toBe(120);
      expect(t.defaultConfig.mass).toBe(1);
      expect(t.defaultConfig.velocity).toBe(0);
    });

    it('passes spring velocity through to the native config', () => {
      const { rerender } = render(
        <EaseView
          testID="ease"
          transition={{ type: 'spring', velocity: 2.5 }}
        />,
      );
      expect(getNativeProps().transitions.defaultConfig.velocity).toBe(2.5);

      // Negative velocity means the value is already moving down.
      rerender(
        <EaseView
          testID="ease"
          transition={{ type: 'spring', velocity: -2.5 }}
        />,
      );
      expect(getNativeProps().transitions.defaultConfig.velocity).toBe(-2.5);
    });

    it('ignores velocity on timing transitions', () => {
      render(
        <EaseView
          testID="ease"
          // @ts-expect-error velocity is spring-only
          transition={{ type: 'timing', duration: 200, velocity: 5 }}
        />,
      );
      expect(getNativeProps().transitions.defaultConfig.velocity).toBe(0);
    });

    it('passes none transition type to defaultConfig', () => {
      render(<EaseView testID="ease" transition={{ type: 'none' }} />);
      const t = getNativeProps().transitions;
      expect(t.defaultConfig.type).toBe('none');
      // No category overrides
      expect(t.opacity).toBeUndefined();
      expect(t.transform).toBeUndefined();
    });

    it('passes custom cubic bezier control points', () => {
      render(
        <EaseView
          testID="ease"
          transition={{
            type: 'timing',
            duration: 400,
            easing: [0.25, 0.1, 0.25, 1.0],
          }}
        />,
      );
      const t = getNativeProps().transitions;
      expect(t.defaultConfig.easingBezier).toEqual([0.25, 0.1, 0.25, 1.0]);
    });

    it('warns for invalid array length', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          transition={{
            type: 'timing',
            easing: [0.25, 0.1, 0.25] as any,
          }}
        />,
      );
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('[x1, y1, x2, y2] tuple'),
      );
      spy.mockRestore();
    });

    it('warns for x-values outside 0-1', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          transition={{
            type: 'timing',
            easing: [1.5, 0, 0.58, 1],
          }}
        />,
      );
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('x-values (x1, x2) must be between 0 and 1'),
      );
      spy.mockRestore();
    });

    it('passes delay for timing transition', () => {
      render(
        <EaseView testID="ease" transition={{ type: 'timing', delay: 200 }} />,
      );
      const t = getNativeProps().transitions;
      expect(t.defaultConfig.delay).toBe(200);
    });

    it('passes delay for spring transition', () => {
      render(
        <EaseView testID="ease" transition={{ type: 'spring', delay: 150 }} />,
      );
      const t = getNativeProps().transitions;
      expect(t.defaultConfig.delay).toBe(150);
    });
  });

  describe('useHardwareLayer', () => {
    it('defaults to false', () => {
      render(<EaseView testID="ease" />);
      expect(getNativeProps().useHardwareLayer).toBe(false);
    });

    it('can be enabled', () => {
      render(<EaseView testID="ease" useHardwareLayer />);
      expect(getNativeProps().useHardwareLayer).toBe(true);
    });
  });

  describe('children and style', () => {
    it('renders children', () => {
      render(
        <EaseView testID="ease">
          <Text>Hello</Text>
        </EaseView>,
      );
      expect(screen.getByText('Hello')).toBeTruthy();
    });

    it('passes className through', () => {
      render(<EaseView testID="ease" className="bg-red-500 p-4" />);
      const props = getNativeProps();
      expect(props.className).toBe('bg-red-500 p-4');
    });

    it('passes style through', () => {
      render(
        <EaseView
          testID="ease"
          style={{ backgroundColor: 'red', borderRadius: 8 }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ backgroundColor: 'red', borderRadius: 8 }),
      );
    });
  });

  describe('animate borderRadius', () => {
    it('passes animateBorderRadius to native', () => {
      render(<EaseView testID="ease" animate={{ borderRadius: 16 }} />);
      expect(getNativeProps().animateBorderRadius).toBe(16);
    });

    it('defaults animateBorderRadius to 0 when not in animate', () => {
      render(<EaseView testID="ease" />);
      expect(getNativeProps().animateBorderRadius).toBe(0);
    });

    it('sets bitmask for borderRadius (1 << 8 = 256)', () => {
      render(<EaseView testID="ease" animate={{ borderRadius: 16 }} />);
      // borderRadius = 1<<8 = 256
      expect(getNativeProps().animatedProperties).toBe(256);
    });

    it('strips style borderRadius when animate.borderRadius is set', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          animate={{ borderRadius: 16 }}
          style={{ borderRadius: 8, backgroundColor: 'red' }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ backgroundColor: 'red' }),
      );
      expect(props.style.borderRadius).toBeUndefined();
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('borderRadius found in both style and animate'),
      );
      spy.mockRestore();
    });

    it('keeps style borderRadius when not in animate', () => {
      render(
        <EaseView
          testID="ease"
          style={{ borderRadius: 8, backgroundColor: 'red' }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ borderRadius: 8, backgroundColor: 'red' }),
      );
    });

    it('passes initialAnimateBorderRadius', () => {
      render(
        <EaseView
          testID="ease"
          initialAnimate={{ borderRadius: 0 }}
          animate={{ borderRadius: 16 }}
        />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateBorderRadius).toBe(0);
      expect(props.animateBorderRadius).toBe(16);
    });
  });

  describe('animate backgroundColor', () => {
    it('passes color value to native', () => {
      render(<EaseView testID="ease" animate={{ backgroundColor: 'red' }} />);
      const props = getNativeProps();
      expect(props.animateBackgroundColor).toBe('red');
    });

    it('defaults animateBackgroundColor to transparent when not in animate', () => {
      render(<EaseView testID="ease" />);
      expect(getNativeProps().animateBackgroundColor).toBe('transparent');
    });

    it('sets bitmask for backgroundColor (1 << 9 = 512)', () => {
      render(<EaseView testID="ease" animate={{ backgroundColor: 'blue' }} />);
      expect(getNativeProps().animatedProperties).toBe(512);
    });

    it('strips style backgroundColor when animate.backgroundColor is set', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          animate={{ backgroundColor: 'red' }}
          style={{ backgroundColor: 'blue', borderRadius: 8 }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(expect.objectContaining({ borderRadius: 8 }));
      expect(props.style.backgroundColor).toBeUndefined();
      spy.mockRestore();
    });

    it('keeps style backgroundColor when not in animate', () => {
      render(
        <EaseView
          testID="ease"
          style={{ backgroundColor: 'blue', borderRadius: 8 }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ backgroundColor: 'blue', borderRadius: 8 }),
      );
    });

    it('passes initialAnimateBackgroundColor as ColorValue', () => {
      render(
        <EaseView
          testID="ease"
          initialAnimate={{ backgroundColor: 'green' }}
          animate={{ backgroundColor: 'red' }}
        />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateBackgroundColor).toBe('green');
      expect(props.animateBackgroundColor).toBe('red');
    });

    it('falls back initialAnimateBackgroundColor to animate value when no initialAnimate', () => {
      render(<EaseView testID="ease" animate={{ backgroundColor: 'red' }} />);
      const props = getNativeProps();
      expect(props.initialAnimateBackgroundColor).toBe('red');
    });
  });

  describe('style conflict handling', () => {
    it('warns when opacity is in both style and animate', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          animate={{ opacity: 0.5 }}
          style={{ opacity: 1, backgroundColor: 'blue' }}
        />,
      );
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('opacity found in both style and animate'),
      );
      spy.mockRestore();
    });

    it('strips conflicting style keys, keeps non-conflicting', () => {
      render(
        <EaseView
          testID="ease"
          animate={{ opacity: 0.5 }}
          style={{ opacity: 1, backgroundColor: 'blue' }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ backgroundColor: 'blue' }),
      );
      expect(props.style.opacity).toBeUndefined();
    });

    it('does not warn when there is no conflict', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          animate={{ opacity: 0.5 }}
          style={{ backgroundColor: 'red' }}
        />,
      );
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('allows opacity in style when not animated', () => {
      render(
        <EaseView
          testID="ease"
          style={{ opacity: 0.5, backgroundColor: 'red' }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ opacity: 0.5, backgroundColor: 'red' }),
      );
    });
  });

  describe('per-property transition map', () => {
    it('sets only defaultConfig from single transition', () => {
      render(
        <EaseView testID="ease" transition={{ type: 'spring', damping: 20 }} />,
      );
      const t = getNativeProps().transitions;
      expect(t.defaultConfig.type).toBe('spring');
      expect(t.defaultConfig.damping).toBe(20);
      // No category overrides — native falls back to defaultConfig
      expect(t.opacity).toBeUndefined();
      expect(t.transform).toBeUndefined();
      expect(t.backgroundColor).toBeUndefined();
    });

    it('sets defaultConfig with default-only map', () => {
      render(
        <EaseView
          testID="ease"
          transition={{
            default: { type: 'timing', duration: 500, easing: 'linear' },
          }}
        />,
      );
      const t = getNativeProps().transitions;
      expect(t.defaultConfig.type).toBe('timing');
      expect(t.defaultConfig.duration).toBe(500);
      // No category overrides
      expect(t.opacity).toBeUndefined();
      expect(t.transform).toBeUndefined();
    });

    it('applies category-specific overrides', () => {
      render(
        <EaseView
          testID="ease"
          transition={{
            default: { type: 'timing', duration: 300 },
            opacity: { type: 'timing', duration: 150, easing: 'easeOut' },
            transform: { type: 'spring', damping: 20, stiffness: 200 },
          }}
        />,
      );
      const t = getNativeProps().transitions;
      // opacity override
      expect(t.opacity!.type).toBe('timing');
      expect(t.opacity!.duration).toBe(150);
      // transform override
      expect(t.transform!.type).toBe('spring');
      expect(t.transform!.damping).toBe(20);
      expect(t.transform!.stiffness).toBe(200);
      // defaultConfig for non-overridden categories
      expect(t.defaultConfig.type).toBe('timing');
      expect(t.defaultConfig.duration).toBe(300);
      // borderRadius/backgroundColor not set — native uses defaultConfig
      expect(t.borderRadius).toBeUndefined();
      expect(t.backgroundColor).toBeUndefined();
    });

    it('does not inject spring default for transforms when no default key', () => {
      render(
        <EaseView
          testID="ease"
          transition={{
            opacity: { type: 'timing', duration: 150 },
          }}
        />,
      );
      const t = getNativeProps().transitions;
      // opacity is explicitly set
      expect(t.opacity!.type).toBe('timing');
      expect(t.opacity!.duration).toBe(150);
      // defaultConfig is timing 300ms (library default)
      expect(t.defaultConfig.type).toBe('timing');
      expect(t.defaultConfig.duration).toBe(300);
      // No spring injection — transform falls back to defaultConfig on native
      expect(t.transform).toBeUndefined();
      expect(t.borderRadius).toBeUndefined();
      expect(t.backgroundColor).toBeUndefined();
    });

    it('does not inject spring transform when default key is provided', () => {
      render(
        <EaseView
          testID="ease"
          transition={{
            default: { type: 'timing', duration: 500 },
            opacity: { type: 'timing', duration: 150 },
          }}
        />,
      );
      const t = getNativeProps().transitions;
      // explicit default overrides library defaults
      expect(t.defaultConfig.type).toBe('timing');
      expect(t.defaultConfig.duration).toBe(500);
      // transform not injected — user opted into explicit default
      expect(t.transform).toBeUndefined();
    });

    it('supports per-category delay in transition map', () => {
      render(
        <EaseView
          testID="ease"
          transition={{
            default: { type: 'timing', duration: 300, delay: 100 },
            opacity: { type: 'timing', duration: 200, delay: 50 },
          }}
        />,
      );
      const t = getNativeProps().transitions;
      expect(t.opacity!.delay).toBe(50);
      // defaultConfig has delay 100 — native uses this for non-overridden categories
      expect(t.defaultConfig.delay).toBe(100);
    });

    it('supports transform category for all transform properties', () => {
      render(
        <EaseView
          testID="ease"
          transition={{
            default: { type: 'timing', duration: 300 },
            transform: { type: 'spring', damping: 10, stiffness: 100 },
          }}
        />,
      );
      const t = getNativeProps().transitions;
      expect(t.transform!.type).toBe('spring');
      expect(t.transform!.damping).toBe(10);
      expect(t.transform!.stiffness).toBe(100);
    });
  });

  describe('animate borderWidth', () => {
    it('passes borderWidth to native', () => {
      render(<EaseView testID="ease" animate={{ borderWidth: 2 }} />);
      expect(getNativeProps().animateBorderWidth).toBe(2);
    });

    it('defaults borderWidth to 0', () => {
      render(<EaseView testID="ease" />);
      expect(getNativeProps().animateBorderWidth).toBe(0);
    });

    it('sets bitmask for borderWidth (1 << 10 = 1024)', () => {
      render(<EaseView testID="ease" animate={{ borderWidth: 2 }} />);
      expect(getNativeProps().animatedProperties).toBe(1024);
    });

    it('passes initialAnimate borderWidth', () => {
      render(
        <EaseView
          testID="ease"
          initialAnimate={{ borderWidth: 0 }}
          animate={{ borderWidth: 3 }}
        />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateBorderWidth).toBe(0);
      expect(props.animateBorderWidth).toBe(3);
    });

    it('strips style borderWidth when animate.borderWidth is set', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          animate={{ borderWidth: 2 }}
          style={{ borderWidth: 1, backgroundColor: 'red' }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ backgroundColor: 'red' }),
      );
      expect(props.style.borderWidth).toBeUndefined();
      spy.mockRestore();
    });
  });

  describe('animate borderColor', () => {
    it('passes borderColor as ColorValue', () => {
      render(<EaseView testID="ease" animate={{ borderColor: 'red' }} />);
      expect(getNativeProps().animateBorderColor).toBe('red');
    });

    it('defaults borderColor to black', () => {
      render(<EaseView testID="ease" />);
      expect(getNativeProps().animateBorderColor).toBe('black');
    });

    it('sets bitmask for borderColor (1 << 11 = 2048)', () => {
      render(<EaseView testID="ease" animate={{ borderColor: 'blue' }} />);
      expect(getNativeProps().animatedProperties).toBe(2048);
    });

    it('passes initialAnimate borderColor', () => {
      render(
        <EaseView
          testID="ease"
          initialAnimate={{ borderColor: 'blue' }}
          animate={{ borderColor: 'red' }}
        />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateBorderColor).toBe('blue');
      expect(props.animateBorderColor).toBe('red');
    });

    it('strips style borderColor when animate.borderColor is set', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          animate={{ borderColor: 'red' }}
          style={{ borderColor: 'blue', backgroundColor: 'red' }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ backgroundColor: 'red' }),
      );
      expect(props.style.borderColor).toBeUndefined();
      spy.mockRestore();
    });
  });

  describe('animate shadow properties', () => {
    it('passes shadow props to native', () => {
      render(
        <EaseView
          testID="ease"
          animate={{
            shadowOpacity: 0.5,
            shadowRadius: 10,
            shadowOffset: { width: 2, height: 4 },
          }}
        />,
      );
      const props = getNativeProps();
      expect(props.animateShadowOpacity).toBe(0.5);
      expect(props.animateShadowRadius).toBe(10);
      expect(props.animateShadowOffsetX).toBe(2);
      expect(props.animateShadowOffsetY).toBe(4);
    });

    it('defaults shadow props to 0 when not in animate', () => {
      render(<EaseView testID="ease" />);
      const props = getNativeProps();
      expect(props.animateShadowOpacity).toBe(0);
      expect(props.animateShadowRadius).toBe(0);
      expect(props.animateShadowOffsetX).toBe(0);
      expect(props.animateShadowOffsetY).toBe(0);
    });

    it('passes shadowColor as ColorValue', () => {
      render(<EaseView testID="ease" animate={{ shadowColor: 'red' }} />);
      expect(getNativeProps().animateShadowColor).toBe('red');
    });

    it('defaults shadowColor to black when not in animate', () => {
      render(<EaseView testID="ease" />);
      expect(getNativeProps().animateShadowColor).toBe('black');
    });

    it('sets bitmask for shadow properties', () => {
      render(
        <EaseView
          testID="ease"
          animate={{ shadowOpacity: 0.5, shadowRadius: 10 }}
        />,
      );
      // shadowOpacity = 1<<12 = 4096, shadowRadius = 1<<13 = 8192 → 12288
      expect(getNativeProps().animatedProperties).toBe(12288);
    });

    it('sets bitmask for shadowColor (1 << 14 = 16384)', () => {
      render(<EaseView testID="ease" animate={{ shadowColor: 'blue' }} />);
      expect(getNativeProps().animatedProperties).toBe(16384);
    });

    it('sets bitmask for shadowOffset (1 << 15 = 32768)', () => {
      render(
        <EaseView
          testID="ease"
          animate={{ shadowOffset: { width: 2, height: 4 } }}
        />,
      );
      expect(getNativeProps().animatedProperties).toBe(32768);
    });

    it('passes initialAnimate shadow values', () => {
      render(
        <EaseView
          testID="ease"
          initialAnimate={{ shadowOpacity: 0, shadowRadius: 0 }}
          animate={{ shadowOpacity: 0.5, shadowRadius: 10 }}
        />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateShadowOpacity).toBe(0);
      expect(props.initialAnimateShadowRadius).toBe(0);
      expect(props.animateShadowOpacity).toBe(0.5);
      expect(props.animateShadowRadius).toBe(10);
    });

    it('passes initialAnimate shadowColor', () => {
      render(
        <EaseView
          testID="ease"
          initialAnimate={{ shadowColor: 'blue' }}
          animate={{ shadowColor: 'red' }}
        />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateShadowColor).toBe('blue');
      expect(props.animateShadowColor).toBe('red');
    });

    it('strips style shadowOpacity when animate.shadowOpacity is set', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          animate={{ shadowOpacity: 0.5 }}
          style={{ shadowOpacity: 1, backgroundColor: 'red' }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ backgroundColor: 'red' }),
      );
      expect(props.style.shadowOpacity).toBeUndefined();
      spy.mockRestore();
    });

    it('strips style shadowOffset when animate.shadowOffset is set', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          animate={{ shadowOffset: { width: 2, height: 4 } }}
          style={{
            shadowOffset: { width: 0, height: 3 },
            backgroundColor: 'red',
          }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ backgroundColor: 'red' }),
      );
      expect(props.style.shadowOffset).toBeUndefined();
      spy.mockRestore();
    });
  });

  describe('animate elevation', () => {
    it('passes elevation to native', () => {
      render(<EaseView testID="ease" animate={{ elevation: 5 }} />);
      expect(getNativeProps().animateElevation).toBe(5);
    });

    it('defaults elevation to 0', () => {
      render(<EaseView testID="ease" />);
      expect(getNativeProps().animateElevation).toBe(0);
    });

    it('sets bitmask for elevation (1 << 16 = 65536)', () => {
      render(<EaseView testID="ease" animate={{ elevation: 5 }} />);
      expect(getNativeProps().animatedProperties).toBe(65536);
    });

    it('passes initialAnimate elevation', () => {
      render(
        <EaseView
          testID="ease"
          initialAnimate={{ elevation: 0 }}
          animate={{ elevation: 10 }}
        />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateElevation).toBe(0);
      expect(props.animateElevation).toBe(10);
    });

    it('strips style elevation when animate.elevation is set', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <EaseView
          testID="ease"
          animate={{ elevation: 5 }}
          style={{ elevation: 2, backgroundColor: 'red' }}
        />,
      );
      const props = getNativeProps();
      expect(props.style).toEqual(
        expect.objectContaining({ backgroundColor: 'red' }),
      );
      expect(props.style.elevation).toBeUndefined();
      spy.mockRestore();
    });
  });

  describe('border transition category', () => {
    it('passes border category in transition map', () => {
      render(
        <EaseView
          testID="ease"
          transition={{
            default: { type: 'timing', duration: 300 },
            border: { type: 'spring', damping: 20, stiffness: 200 },
          }}
        />,
      );
      const t = getNativeProps().transitions;
      expect(t.border!.type).toBe('spring');
      expect(t.border!.damping).toBe(20);
      expect(t.border!.stiffness).toBe(200);
      expect(t.defaultConfig.type).toBe('timing');
    });
  });

  describe('shadow transition category', () => {
    it('passes shadow category in transition map', () => {
      render(
        <EaseView
          testID="ease"
          transition={{
            default: { type: 'timing', duration: 300 },
            shadow: { type: 'spring', damping: 20, stiffness: 200 },
          }}
        />,
      );
      const t = getNativeProps().transitions;
      expect(t.shadow!.type).toBe('spring');
      expect(t.shadow!.damping).toBe(20);
      expect(t.shadow!.stiffness).toBe(200);
      expect(t.defaultConfig.type).toBe('timing');
    });
  });

  describe('rotate loop props', () => {
    it('passes rotate 0→360 with loop repeat to native', () => {
      render(
        <EaseView
          testID="ease"
          initialAnimate={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{
            type: 'timing',
            duration: 1000,
            easing: 'linear',
            loop: 'repeat',
          }}
        />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateRotate).toBe(0);
      expect(props.animateRotate).toBe(360);
      expect(props.transitions.defaultConfig.loop).toBe('repeat');
      // rotate bit = 1<<5 = 32
      // eslint-disable-next-line no-bitwise
      expect(props.animatedProperties & 32).toBe(32);
    });

    it('passes rotate with scale for combined loop animation', () => {
      render(
        <EaseView
          testID="ease"
          initialAnimate={{ rotate: 0, scale: 0.8 }}
          animate={{ rotate: 360, scale: 1.2 }}
          transition={{
            type: 'timing',
            duration: 1500,
            easing: 'easeInOut',
            loop: 'reverse',
          }}
        />,
      );
      const props = getNativeProps();
      expect(props.initialAnimateRotate).toBe(0);
      expect(props.animateRotate).toBe(360);
      expect(props.initialAnimateScaleX).toBe(0.8);
      expect(props.initialAnimateScaleY).toBe(0.8);
      expect(props.animateScaleX).toBe(1.2);
      expect(props.animateScaleY).toBe(1.2);
      expect(props.transitions.defaultConfig.loop).toBe('reverse');
    });
  });
});
