import { useState, useEffect, useCallback } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { Alert } from 'react-native';
import { RootState } from '../../domain/types/store/RootState';
import { noteEditorService } from '../../application/services/notes/noteEditorService';
import { notesSQLiteService } from '../../application/services/notes/notesSQLiteService';
import { setAllNotes } from '../../application/store/action/notes/setAllNotes';

export const useNoteEditor = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch(); // Get dispatch for Redux updates
  const authState = useSelector((state: RootState) => state.auth);

  // Get noteId from route params
  const noteId = (route.params as any)?.noteId || null;
  const isNewNote = !noteId;

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalDetails, setOriginalDetails] = useState('');

  const noteTitle = title.trim() || (isNewNote ? 'New Note' : 'Untitled Note');

  // Load note data when component mounts
  useEffect(() => {
    if (noteId && authState.id) {
      loadNoteData();
    }
  }, [noteId, authState.id]);

  // Track changes to enable save button
  useEffect(() => {
    const titleChanged = title !== originalTitle;
    const detailsChanged = details !== originalDetails;
    setHasChanges(titleChanged || detailsChanged);
  }, [title, details, originalTitle, originalDetails]);

  const loadNoteData = async () => {
    if (!noteId || !authState.id) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const note = await noteEditorService.loadNoteById(noteId, authState.id);
      
      if (note) {
        setTitle(note.title || '');
        setDetails(note.details || '');
        setOriginalTitle(note.title || '');
        setOriginalDetails(note.details || '');
      } else {
        setError('Note not found');
      }
    } catch (error) {
      console.error('❌ Error loading note data:', error);
      setError('Failed to load note');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (): Promise<boolean> => {
    if (!authState.id) {
      setError('User not authenticated');
      return false;
    }

    // Validation
    if (!title.trim() && !details.trim()) {
      Alert.alert('Empty Note', 'Please add some content before saving.');
      return false;
    }

    setSaving(true);
    setError('');

    try {
      
      // CALL NEW SERVICE METHOD WITH DISPATCH - Our agreed plan
      const result = await noteEditorService.saveNote(
        noteId || null,
        title,
        details,
        authState.id,
        authState.accessToken,
        dispatch // Pass dispatch for Redux updates
      );

      if (result.success) {
        
        // Note: Redux is already updated by the service, no need for additional refresh
        
        // Reset hasChanges flag
        setHasChanges(false);
        
        // Update original values to track future changes
        setOriginalTitle(title);
        setOriginalDetails(details);
        
        // For new notes, update the route params with the new note ID
        if (isNewNote && result.noteId) {
          // Update navigation state to reflect that this is now an existing note
          (navigation as any).setParams({ noteId: result.noteId, title: title.trim() || 'New Note' });
        }
        
        return true;
      } else {
        setError(result.error || 'Failed to save note');
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving note:', error);
      setError('Failed to save note');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleGoBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save before leaving?',
        [
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => navigation.goBack()
          },
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Save', 
            onPress: async () => {
              const saved = await handleSave();
              if (saved) {
                navigation.goBack();
              }
            }
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleSettings = () => {
    navigation.navigate('Settings' as never);
  };

  return {
    title,
    details,
    noteTitle,
    loading,
    saving,
    error,
    hasChanges,
    isNewNote,
    setTitle,
    setDetails,
    handleSave,
    handleSettings,
    handleGoBack,
  };
}; 