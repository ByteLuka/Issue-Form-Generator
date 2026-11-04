import { Badge, Collapse, Group, List, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconChevronDown,
  IconCircleCheck,
} from '@tabler/icons-react';
import type { ValidationIssue } from '../../lib/validate';

/** Scrolls the editor to the element card and highlights it. */
function revealElement(uid: string) {
  const card = document.getElementById(`element-${uid}`);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.remove('flash');
  void card.offsetWidth; // restart the animation
  card.classList.add('flash');
}

export function ValidationSummary({ issues }: { issues: ValidationIssue[] }) {
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');
  const [opened, { toggle }] = useDisclosure(false);

  if (issues.length === 0) {
    return (
      <Group gap={6} px="md" py={6}>
        <IconCircleCheck size={16} color="var(--mantine-color-green-6)" />
        <Text size="xs" c="dimmed">
          No problems found. The form is ready to use.
        </Text>
      </Group>
    );
  }

  return (
    <div>
      <UnstyledButton onClick={toggle} px="md" py={6} w="100%" aria-expanded={opened}>
        <Group gap={6}>
          {errors.length > 0 && (
            <Badge color="red" variant="light" size="sm">
              {errors.length} {errors.length === 1 ? 'error' : 'errors'}
            </Badge>
          )}
          {warnings.length > 0 && (
            <Badge color="yellow" variant="light" size="sm">
              {warnings.length} {warnings.length === 1 ? 'warning' : 'warnings'}
            </Badge>
          )}
          <Text size="xs" c="dimmed">
            {opened ? 'Hide details' : 'Show details'}
          </Text>
          <IconChevronDown
            size={14}
            style={{
              transform: opened ? 'rotate(180deg)' : undefined,
              transition: 'transform 150ms',
            }}
          />
        </Group>
      </UnstyledButton>
      <Collapse expanded={opened}>
        <List spacing={4} size="xs" px="md" pb="sm" center>
          {[...errors, ...warnings].map((issue, index) => (
            <List.Item
              key={index}
              icon={
                <ThemeIcon
                  size={18}
                  variant="transparent"
                  color={issue.level === 'error' ? 'red' : 'yellow'}
                >
                  {issue.level === 'error' ? (
                    <IconAlertCircle size={16} />
                  ) : (
                    <IconAlertTriangle size={16} />
                  )}
                </ThemeIcon>
              }
            >
              {issue.elementUid ? (
                <UnstyledButton
                  fz="xs"
                  onClick={() => revealElement(issue.elementUid!)}
                  style={{ textDecoration: 'underline dotted' }}
                >
                  {issue.message}
                </UnstyledButton>
              ) : (
                issue.message
              )}
            </List.Item>
          ))}
        </List>
      </Collapse>
    </div>
  );
}
