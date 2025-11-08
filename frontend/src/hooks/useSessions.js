import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { sessionApi } from "../api/sessions";

export const useCreateSession = () => {
  const result = useMutation({
    mutationFn: sessionApi.createSession,
    onSuccess: () => toast.success("Session created successfully!"),
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to create Sesson"),
  });
  return result;
};

export const useActiveSessions = () => {
  const result = useQuery({
    queryKey: ["activeSessions"],
    queryFn: sessionApi.getActiveSessions,
  });
  return result;
};

export const useMyRecentSessions = () => {
  const result = useQuery({
    queryKey: ["myRecentSessions"],
    queryFn: sessionApi.getMyRecentSessions,
  });
  return result;
};

export const useSessionById = (id) => {
  const result = useQuery({
    queryKey: ["session", id],
    queryFn: (id) => sessionApi.getSessionById(id),
    enabled: !!id,
    refetchInterval: 5000,
  });
  return result;
};

export const usejoinSession = (id) => {
  const result = useMutation({
    mutationFn: (id) => sessionApi.joinSession(id),
    onSuccess: () => toast.success("Session joined successfully!"),
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to join Session"),
  });
  return result;
};

export const useendSession = (id) => {
  const result = useMutation({
    mutationFn: (id) => sessionApi.endSession(id),
    onSuccess: () => toast.success("Session ended successfully!"),
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to end Session"),
  });
  return result;
};
