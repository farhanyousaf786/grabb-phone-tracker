import re

with open('app/pages/settings/settings.tsx', 'r') as f:
    content = f.read()

# Add transform to Switch
content = re.sub(r'(<Switch\s+[^>]*?)(/?>)', r'\1 style={{ transform: [{ scale: 0.85 }] }} \2', content)

content = content.replace(
    '<Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>',
    '<View style={styles.textContainer}><Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text></View>'
)

content = content.replace(
    '<View>\n                  <Text style={[styles.settingLabel',
    '<View style={styles.textContainer}>\n                  <Text style={[styles.settingLabel'
)

content = content.replace(
    'settingLabelWrap: { flexDirection: \'row\', alignItems: \'center\', gap: 12, flex: 1 },',
    'settingLabelWrap: { flexDirection: \'row\', alignItems: \'center\', gap: 12, flex: 1 },\n  textContainer: { flex: 1, paddingRight: 8 },'
)

with open('app/pages/settings/settings.tsx', 'w') as f:
    f.write(content)

print("Updated settings.tsx")
