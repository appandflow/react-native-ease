import { fireEvent, render, screen } from '@testing-library/react-native';
import { EasePresence } from '../EasePresence';
import { EaseView } from '../EaseView';

describe('EasePresence', () => {
  it('keeps removed child mounted while exit runs, then removes on finish', () => {
    const { rerender } = render(
      <EasePresence>
        <EaseView
          key="card"
          testID="card"
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'timing', duration: 200 }}
        />
      </EasePresence>,
    );

    rerender(<EasePresence>{null}</EasePresence>);

    const exiting = screen.getByTestId('card');
    expect(exiting).toBeTruthy();
    expect(exiting.props.animateOpacity).toBe(0);

    fireEvent(exiting, 'onTransitionEnd', { nativeEvent: { finished: true } });
    expect(screen.queryByTestId('card')).toBeNull();
  });

  it('removes immediately when child has no exit prop', () => {
    const { rerender } = render(
      <EasePresence>
        <EaseView key="card" testID="card" animate={{ opacity: 1 }} />
      </EasePresence>,
    );

    rerender(<EasePresence>{null}</EasePresence>);
    expect(screen.queryByTestId('card')).toBeNull();
  });

  it('forwards onTransitionEnd during exit', () => {
    const onTransitionEnd = jest.fn();
    const { rerender } = render(
      <EasePresence>
        <EaseView
          key="card"
          testID="card"
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'timing', duration: 200 }}
          onTransitionEnd={onTransitionEnd}
        />
      </EasePresence>,
    );

    rerender(<EasePresence>{null}</EasePresence>);

    fireEvent(screen.getByTestId('card'), 'onTransitionEnd', {
      nativeEvent: { finished: true },
    });

    expect(onTransitionEnd).toHaveBeenCalledWith({ finished: true });
  });

  it('does not remove exiting item when transition end is interrupted', () => {
    const { rerender } = render(
      <EasePresence>
        <EaseView
          key="card"
          testID="card"
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'timing', duration: 200 }}
        />
      </EasePresence>,
    );

    rerender(<EasePresence>{null}</EasePresence>);

    fireEvent(screen.getByTestId('card'), 'onTransitionEnd', {
      nativeEvent: { finished: false },
    });

    expect(screen.queryByTestId('card')).toBeTruthy();
  });

  it('warns for missing keys', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <EasePresence>
        <EaseView
          testID="no-key"
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      </EasePresence>,
    );

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('EasePresence requires stable keys on children'),
    );

    spy.mockRestore();
  });
});
