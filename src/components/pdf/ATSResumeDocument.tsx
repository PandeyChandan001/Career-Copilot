import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { TailoredResumeData } from '@/schemas/resumeSchema';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    lineHeight: 1.35,
    flexDirection: 'column',
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    marginBottom: 6,
    paddingBottom: 2,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  role: { fontWeight: 'bold' },
  companyText: { fontStyle: 'italic' },
  bullet: {
    flexDirection: 'row',
    paddingLeft: 8,
    marginBottom: 2,
  },
  bulletPoint: { width: 10, flexShrink: 0 },
  bulletContent: { flex: 1 },
});

export const ATSResumeDocument = ({ resumeData }: { resumeData: TailoredResumeData }) => {
  const contactParts = [
    resumeData.contact.email,
    resumeData.contact.phone,
    resumeData.contact.location,
    resumeData.contact.linkedIn,
    resumeData.contact.github
  ].filter(Boolean);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{resumeData.fullName}</Text>
          <View style={styles.contact}>
            <Text>{contactParts.join(' | ')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUMMARY</Text>
          <Text>{resumeData.summary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TECHNICAL SKILLS</Text>
          <Text>{(resumeData.skills ?? []).join(', ')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFESSIONAL EXPERIENCE</Text>
          {(resumeData.experience ?? []).map((exp, i) => (
            <View key={i} style={{ marginBottom: 8 }}>
              <View style={styles.experienceHeader}>
                <Text style={styles.role}>{exp.role}</Text>
                <Text>{exp.dateRange}</Text>
              </View>
              <View style={styles.experienceHeader}>
                <Text style={styles.companyText}>{exp.company}, {exp.location}</Text>
              </View>
              {(exp.bulletPoints ?? []).map((bp, j) => (
                <View key={j} style={styles.bullet}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletContent}>{bp}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {resumeData.projects && resumeData.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROJECTS</Text>
            {(resumeData.projects ?? []).map((proj, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.role}>{proj.name}</Text>
                  <Text>{proj.technologies}</Text>
                </View>
                {(proj.bulletPoints ?? []).map((bp, j) => (
                  <View key={j} style={styles.bullet}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletContent}>{bp}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EDUCATION</Text>
          {(resumeData.education ?? []).map((edu, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <View style={styles.experienceHeader}>
                <Text style={styles.role}>{edu.institution}</Text>
                <Text>{edu.year}</Text>
              </View>
              <Text>{edu.degree}</Text>
              {(edu.highlights ?? []).map((h, j) => (
                <View key={j} style={styles.bullet}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletContent}>{h}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};
