import { useEffect, useState } from "react";
import {
  upsertTrackRating,
  fetchTrackRatingsForAlbumByUser,
} from "../services/supabase/trackRatings";

type TrackRatingsState = Record<string, number>;

type UseTrackRatingsResult = {
  savedRatings: TrackRatingsState;
  draftRatings: Record<string, string>;
  submitting: Record<string, boolean>;
  errors: Record<string, string>;
  loadError: string;
  setDraftRating: (trackId: string, value: string) => void;
  submitRating: (trackId: string) => Promise<void>;
};

export function useTrackRatings(
  albumId: string | undefined,
  userId: string | undefined,
): UseTrackRatingsResult {
  const [savedRatings, setSavedRatings] = useState<TrackRatingsState>({});
  const [draftRatings, setDraftRatings] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!albumId || !userId) {
      setSavedRatings({});
      setDraftRatings({});
      return;
    }

    let active = true;

    const loadRatings = async () => {
      try {
        const ratings = await fetchTrackRatingsForAlbumByUser(albumId, userId);
        if (!active) return;

        const ratingMap = ratings.reduce<Record<string, number>>(
          (
            acc: Record<string, number>,
            item: { track_id: string; rating: number },
          ) => {
            acc[item.track_id] = item.rating;
            return acc;
          },
          {},
        );

        const draftMap = ratings.reduce<Record<string, string>>(
          (
            acc: Record<string, string>,
            item: { track_id: string; rating: number },
          ) => {
            acc[item.track_id] = String(item.rating);
            return acc;
          },
          {},
        );

        setSavedRatings(ratingMap);
        setDraftRatings(draftMap);
        setLoadError("");
      } catch (error: any) {
        if (!active) return;
        setLoadError(error?.message ?? "Unable to load track ratings.");
      }
    };

    loadRatings();

    return () => {
      active = false;
    };
  }, [albumId, userId]);

  const setDraftRating = (trackId: string, value: string) => {
    setDraftRatings((current) => ({ ...current, [trackId]: value }));
    setErrors((current) => ({ ...current, [trackId]: "" }));
  };

  const submitRating = async (trackId: string) => {
    if (!albumId || !userId) {
      setErrors((current) => ({
        ...current,
        [trackId]: "Unable to submit rating without a valid session.",
      }));
      return;
    }

    const rawValue = draftRatings[trackId] ?? "";
    const rating = Number(rawValue);

    if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
      setErrors((current) => ({
        ...current,
        [trackId]: "Enter a whole number between 1 and 10.",
      }));
      return;
    }

    setSubmitting((current) => ({ ...current, [trackId]: true }));
    setErrors((current) => ({ ...current, [trackId]: "" }));

    try {
      await upsertTrackRating({
        track_id: trackId,
        user_id: userId,
        album_id: albumId,
        rating,
      });

      setSavedRatings((current) => ({ ...current, [trackId]: rating }));
    } catch (error: any) {
      setErrors((current) => ({
        ...current,
        [trackId]: error?.message ?? "Unable to save rating.",
      }));
    } finally {
      setSubmitting((current) => ({ ...current, [trackId]: false }));
    }
  };

  return {
    savedRatings,
    draftRatings,
    submitting,
    errors,
    loadError,
    setDraftRating,
    submitRating,
  };
}
