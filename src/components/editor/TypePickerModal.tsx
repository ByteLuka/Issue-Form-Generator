import {
  Card,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { ELEMENT_INFO } from '../../lib/elements';
import { ELEMENT_TYPES, type ElementType } from '../../lib/types';
import { ELEMENT_COLORS, ELEMENT_ICONS } from '../elementIcons';

interface TypePickerModalProps {
  opened: boolean;
  onClose: () => void;
  onPick: (type: ElementType) => void;
}

/** First step of adding an element: choose what kind of element it is. */
export function TypePickerModal({ opened, onClose, onPick }: TypePickerModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="What do you want to add?" size="lg">
      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
        {ELEMENT_TYPES.map((type) => {
          const Icon = ELEMENT_ICONS[type];
          return (
            <UnstyledButton
              key={type}
              onClick={() => onPick(type)}
              aria-label={ELEMENT_INFO[type].label}
            >
              <Card withBorder padding="sm" h="100%" className="type-option">
                <Group wrap="nowrap" align="flex-start" gap="sm">
                  <ThemeIcon variant="light" color={ELEMENT_COLORS[type]} size="lg">
                    <Icon size={20} />
                  </ThemeIcon>
                  <Stack gap={2}>
                    <Text fw={600} size="sm">
                      {ELEMENT_INFO[type].label}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {ELEMENT_INFO[type].description}
                    </Text>
                  </Stack>
                </Group>
              </Card>
            </UnstyledButton>
          );
        })}
      </SimpleGrid>
    </Modal>
  );
}
