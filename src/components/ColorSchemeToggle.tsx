import {
  Center,
  SegmentedControl,
  Tooltip,
  useMantineColorScheme,
  VisuallyHidden,
  type MantineColorScheme,
} from '@mantine/core';
import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react';

const OPTIONS: { value: MantineColorScheme; label: string; icon: typeof IconSun }[] = [
  { value: 'light', label: 'Light', icon: IconSun },
  { value: 'dark', label: 'Dark', icon: IconMoon },
  { value: 'auto', label: 'System', icon: IconDeviceDesktop },
];

/** Light / dark / auto switch. Mantine stores the choice in localStorage. */
export function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <SegmentedControl
      size="xs"
      value={colorScheme}
      onChange={(value) => setColorScheme(value as MantineColorScheme)}
      aria-label="Color scheme"
      data={OPTIONS.map(({ value, label, icon: Icon }) => ({
        value,
        label: (
          <Tooltip label={label}>
            <Center>
              <Icon size={16} stroke={1.8} />
              <VisuallyHidden>{label}</VisuallyHidden>
            </Center>
          </Tooltip>
        ),
      }))}
    />
  );
}
