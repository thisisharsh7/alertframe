import { diffWords } from 'diff';

export interface ChangeDetectionResult {
  hasChanged: boolean;
  changeType: 'added' | 'removed' | 'modified' | null;
  summary: string | null;
  diffData: {
    type: 'itemCount' | 'text';
    before?: number;
    after?: number;
    diff?: Array<{ value: string; added?: boolean; removed?: boolean }>;
  } | null;
  itemCountChange?: {
    before: number;
    after: number;
    diff: number;
  };
}

/**
 * Compare two snapshots and detect changes
 */
export function detectChanges(
  oldSnapshot: {
    htmlContent: string;
    textContent: string;
    itemCount: number | null;
  },
  newSnapshot: {
    htmlContent: string;
    textContent: string;
    itemCount: number | null;
  }
): ChangeDetectionResult {
  // Check for item count changes (for lists)
  if (oldSnapshot.itemCount !== null && newSnapshot.itemCount !== null) {
    if (oldSnapshot.itemCount !== newSnapshot.itemCount) {
      const diff = newSnapshot.itemCount - oldSnapshot.itemCount;
      const changeType = diff > 0 ? 'added' : 'removed';

      return {
        hasChanged: true,
        changeType,
        summary: `Item count changed from ${oldSnapshot.itemCount} to ${newSnapshot.itemCount} (${diff > 0 ? '+' : ''}${diff})`,
        diffData: {
          type: 'itemCount',
          before: oldSnapshot.itemCount,
          after: newSnapshot.itemCount,
        },
        itemCountChange: {
          before: oldSnapshot.itemCount,
          after: newSnapshot.itemCount,
          diff,
        },
      };
    }
  }

  // Compare text content
  const textDiff = diffWords(
    oldSnapshot.textContent.trim(),
    newSnapshot.textContent.trim()
  );

  const hasTextChanges = textDiff.some(part => part.added || part.removed);

  if (hasTextChanges) {
    // Generate summary
    const addedParts = textDiff.filter(p => p.added).map(p => p.value).join(' ');
    const removedParts = textDiff.filter(p => p.removed).map(p => p.value).join(' ');

    let summary = '';
    if (addedParts && removedParts) {
      summary = `Content modified: "${removedParts.substring(0, 50)}..." → "${addedParts.substring(0, 50)}..."`;
    } else if (addedParts) {
      summary = `Content added: "${addedParts.substring(0, 100)}..."`;
    } else if (removedParts) {
      summary = `Content removed: "${removedParts.substring(0, 100)}..."`;
    }

    return {
      hasChanged: true,
      changeType: addedParts && removedParts ? 'modified' : addedParts ? 'added' : 'removed',
      summary,
      diffData: {
        type: 'text',
        diff: textDiff,
      },
    };
  }

  // No changes detected
  return {
    hasChanged: false,
    changeType: null,
    summary: null,
    diffData: null,
  };
}

/**
 * Format diff for email display
 */
export function formatDiffForEmail(diffData: {
  type: 'itemCount' | 'text';
  before?: number;
  after?: number;
  diff?: Array<{ value: string; added?: boolean; removed?: boolean }>;
} | null): string {
  if (!diffData) return 'No changes detected';

  if (diffData.type === 'itemCount') {
    return `Item count changed from ${diffData.before} to ${diffData.after}`;
  }

  if (diffData.type === 'text' && diffData.diff) {
    let html = '<div style="font-family: monospace; white-space: pre-wrap;">';

    diffData.diff.forEach((part) => {
      const text = part.value;
      if (part.added) {
        html += `<span style="background-color: #d4edda; color: #155724;">${escapeHtml(text)}</span>`;
      } else if (part.removed) {
        html += `<span style="background-color: #f8d7da; color: #721c24; text-decoration: line-through;">${escapeHtml(text)}</span>`;
      } else {
        html += escapeHtml(text);
      }
    });

    html += '</div>';
    return html;
  }

  return 'Changes detected';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
