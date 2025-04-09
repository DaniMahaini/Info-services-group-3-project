import React, { useState } from "react";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";

const allTags = ["music", "outdoors", "food", "technology", "sports"];

const initialEvents = [
  {
    id: 1,
    title: "Jazz Festival",
    description: "An exciting jazz music event featuring top bands.",
    time: "April 20, 2025, 6:00 PM",
    location: "Central Park Amphitheater",
    tags: { music: 1.0, outdoors: 0.3 },
    reviews: [
      { text: "Amazing atmosphere!", date: "2025-04-01", likes: 3, comments: ["Absolutely!", "Can't wait to go again."] }
    ],
  },
  {
    id: 2,
    title: "Nature Hike",
    description: "Join us for a relaxing hike in the hills.",
    time: "April 15, 2025, 9:00 AM",
    location: "Greenridge Trail",
    tags: { outdoors: 0.9 },
    reviews: [],
  },
  {
    id: 3,
    title: "Food Truck Fiesta",
    description: "Taste the best food trucks in the city all in one place!",
    time: "April 22, 2025, 12:00 PM",
    location: "Downtown Square",
    tags: { food: 0.8, outdoors: 0.5 },
    reviews: [],
  },
];

const getTimeDecayFactor = (lastDate, lambda = 0.05) => {
  const today = new Date();
  const interactionDate = new Date(lastDate);
  const diffDays = Math.floor((today - interactionDate) / (1000 * 60 * 60 * 24));
  return Math.exp(-lambda * diffDays);
};

const getInteractionWeight = (type) => {
  if (type === "review") return 3;
  if (type === "save") return 2;
  return 1;
};

const calculateRelevanceWithBreakdown = (event, userScores) => {
  let relevance = 0;
  const breakdown = [];
  for (const tag in event.tags) {
    const userScore = userScores[tag] || 0;
    const weight = event.tags[tag];
    const contribution = userScore * weight;
    if (userScore > 0) {
      breakdown.push({
        tag,
        userScore: userScore.toFixed(2),
        eventWeight: weight,
        contribution: contribution.toFixed(2),
      });
    }
    relevance += contribution;
  }
  return { relevance: relevance.toFixed(2), breakdown };
};

export default function EventHubApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [accountType, setAccountType] = useState("user");
  const [interests, setInterests] = useState([]);
  const [userTagScores, setUserTagScores] = useState({});
  const [events, setEvents] = useState(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newReview, setNewReview] = useState("");
  const [newEvent, setNewEvent] = useState({ title: "", tags: {} });
  const [page, setPage] = useState("explore");
  const [viewEventDetail, setViewEventDetail] = useState(null);
  const [commentInput, setCommentInput] = useState({});

  const handleLogin = () => {
    if ((accountType === "organizer") || (interests.length > 0 && accountType === "user")) {
      const today = new Date().toISOString().split("T")[0];
      const baseScores = {};
      interests.forEach(tag => {
        const decay = getTimeDecayFactor(today);
        baseScores[tag] = getInteractionWeight("like") * decay;
      });
      setUserTagScores(baseScores);
      setCurrentUser("demo_user");
      setViewEventDetail(null);
      setPage("dashboard");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserTagScores({});
    setSelectedEvent(null);
    setPage("explore");
  };

  const updateUserTagScore = (tags, type) => {
    const today = new Date().toISOString().split("T")[0];
    setUserTagScores(prev => {
      const updated = { ...prev };
      tags.forEach(tag => {
        const decay = getTimeDecayFactor(today);
        const weight = getInteractionWeight(type);
        const score = weight * decay;
        updated[tag] = (updated[tag] || 0) + score;
      });
      return updated;
    });
  };

  const handleReviewSubmit = () => {
    if (!newReview || !selectedEvent) return;
    const updatedEvents = events.map(event => {
      if (event.id === selectedEvent.id) {
        return {
          ...event,
          reviews: [...event.reviews, { text: newReview, date: new Date().toISOString(), likes: 0, comments: [] }],
        };
      }
      return event;
    });
    setEvents(updatedEvents);
    setViewEventDetail(updatedEvents.find(e => e.id === selectedEvent.id));
    updateUserTagScore(Object.keys(selectedEvent.tags), "review");
    setNewReview("");
  };

  const handleLikeReview = (eventId, reviewIndex) => {
    const updatedEvents = events.map(event => {
      if (event.id === eventId) {
        const updatedReviews = [...event.reviews];
        updatedReviews[reviewIndex].likes += 1;
        return { ...event, reviews: updatedReviews };
      }
      return event;
    });
    setEvents(updatedEvents);
  };

  const handleCommentReview = (eventId, reviewIndex) => {
    const comment = commentInput[reviewIndex];
    if (!comment) return;
    const updatedEvents = events.map(event => {
      if (event.id === eventId) {
        const updatedReviews = [...event.reviews];
        updatedReviews[reviewIndex].comments.push(comment);
        return { ...event, reviews: updatedReviews };
      }
      return event;
    });
    setEvents(updatedEvents);
    setCommentInput({ ...commentInput, [reviewIndex]: "" });
  };

  const handleEventSubmit = () => {
    if (!newEvent.title || Object.keys(newEvent.tags).length === 0) return;
    const event = {
      id: events.length + 1,
      title: newEvent.title,
      tags: newEvent.tags,
      description: "Event description goes here.",
      time: "To be decided",
      location: "TBD",
      reviews: [],
    };
    setEvents([...events, event]);
    setNewEvent({ title: "", tags: {} });
  };

  const handleInteraction = (event, type) => {
    updateUserTagScore(Object.keys(event.tags), type);
  };

  const recommended = events
      .map((event) => {
        const { relevance, breakdown } = calculateRelevanceWithBreakdown(event, userTagScores);
        return { ...event, relevance, breakdown };
      })
      .sort((a, b) => parseFloat(b.relevance) - parseFloat(a.relevance));

  if (page === "explore") {
    return (
        <div className="p-4 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Explore Events</h1>
          <ul className="space-y-3">
            {events.map(event => (
                <li key={event.id} className="bg-white rounded-xl shadow p-4">
                  <div className="font-semibold text-lg cursor-pointer" onClick={() => setViewEventDetail(event)}>{event.title}</div>
                  <div className="text-sm text-gray-600">{event.description}</div>
                </li>
            ))}
          </ul>
          <div className="mt-6 flex gap-4">
            <Button onClick={() => { setAccountType("user"); setPage("login"); }}>Login as User</Button>
            <Button onClick={() => { setAccountType("organizer"); setPage("login"); }}>Login as Organizer</Button>
          </div>
        </div>
    );
  }

  if (viewEventDetail && page !== "dashboard") {
    return (
        <div className="p-4 max-w-2xl mx-auto">
          <Button variant="outline" onClick={() => setViewEventDetail(null)}>← Back</Button>
          <h2 className="text-2xl font-bold mt-2">{viewEventDetail.title}</h2>
          <p className="mt-1">{viewEventDetail.description}</p>
          <p className="text-sm text-gray-600">Time: {viewEventDetail.time}</p>
          <p className="text-sm text-gray-600 mb-4">Location: {viewEventDetail.location}</p>

          <h3 className="font-semibold mt-4">Leave a Review</h3>
          <Input
              placeholder="Write your review..."
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              className="mb-2"
          />
          <Button onClick={() => {
            setSelectedEvent(viewEventDetail);
            handleReviewSubmit();
          }}>Submit Review</Button>

          <div className="mt-4">
            <h3 className="font-semibold">Reviews:</h3>
            {viewEventDetail.reviews.length > 0 ? (
                <ul className="text-sm text-gray-800 mt-2">
                  {viewEventDetail.reviews.map((r, i) => (
                      <li key={i} className="border-b py-2">
                        <p>{r.text}</p>
                        <div className="text-xs text-gray-500">{r.date}</div>
                        <div className="text-xs mt-1">
                          👍 {r.likes}
                          <Button size="sm" className="ml-2" onClick={() => handleLikeReview(viewEventDetail.id, i)}>Like</Button>
                        </div>
                        <div className="mt-2">
                          <Input
                              placeholder="Add a comment..."
                              value={commentInput[i] || ""}
                              onChange={(e) => setCommentInput({ ...commentInput, [i]: e.target.value })}
                              className="mb-1"
                          />
                          <Button size="sm" onClick={() => handleCommentReview(viewEventDetail.id, i)}>Comment</Button>
                          {r.comments.length > 0 && (
                              <ul className="text-xs text-gray-700 mt-1 pl-3 list-disc">
                                {r.comments.map((c, ci) => <li key={ci}>{c}</li>)}
                              </ul>
                          )}
                        </div>
                      </li>
                  ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500">No reviews yet.</p>
            )}
          </div>
        </div>
    );
  }
  return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{accountType === "organizer" ? "Organizer Dashboard" : "Recommended Events"}</h1>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>

        {accountType === "organizer" && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Submit New Event</h2>
              <Input
                  type="text"
                  placeholder="Event Title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="mb-2"
              />
              <div className="mb-2">
                <label className="font-medium">Select Tags:</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {allTags.map(tag => (
                      <button
                          key={tag}
                          className={`px-2 py-1 border rounded-full ${newEvent.tags[tag] ? "bg-green-500 text-white" : "bg-white"}`}
                          onClick={() => {
                            const updatedTags = { ...newEvent.tags };
                            if (updatedTags[tag]) delete updatedTags[tag];
                            else updatedTags[tag] = 1.0;
                            setNewEvent({ ...newEvent, tags: updatedTags });
                          }}
                      >
                        {tag}
                      </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleEventSubmit}>Submit Event</Button>
            </div>
        )}

        {accountType === "user" && (
            <ul className="space-y-3">
              {recommended.map((event) => (
                  <li
                      key={event.id}
                      className="bg-white rounded-2xl shadow p-4 transition"
                  >
                    <div className="font-semibold text-lg cursor-pointer" onClick={() => setViewEventDetail(event)}>{event.title}</div>
                    <div className="text-sm text-gray-600 mb-2">
                      Relevance Score: {event.relevance}
                    </div>
                    <div className="flex gap-3 text-sm mt-2">
                      <Button size="sm" onClick={() => handleInteraction(event, "like")}>Like</Button>
                      <Button size="sm" onClick={() => handleInteraction(event, "save")}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => window.open("https://eventix.io", "_blank")}>Buy Tickets</Button>
                    </div>
                  </li>
              ))}
            </ul>
        )}
      </div>
  );
}
