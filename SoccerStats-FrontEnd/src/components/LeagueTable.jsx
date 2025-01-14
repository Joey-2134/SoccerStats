// src/components/LeagueTable.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LeagueTable = () => {
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentLeague, setCurrentLeague] = useState({ name: '' });
    const [isEditing, setIsEditing] = useState(false);


    // gets ID for a league from the backend. Need to get this ID for Create Delete and Update
    const extractIdFromLink = (league) => {
        const selfLink = league._links?.self?.href;
        if (selfLink) {
            const parts = selfLink.split('/');
            return parts[parts.length - 1]; // eg. for the prem (/api/leagues/1) this will extract '1' and set it as the prems ID
        }
        return null;
    };
    // useEffect(() => {
        const fetchLeagues = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/leagues');
                console.log("response.data._embedded.leagues: ", response.data._embedded.leagues);
                setLeagues(response.data._embedded?.leagues || []);
                setLoading(false);
            } catch (err) {
                setError('Error fetching leagues');
                setLoading(false);
            }
        };
        //fetchLeagues moved outside of useEffect so it can be used by other CRUD functions
        useEffect(() => {
        fetchLeagues();
    }, []);
    // }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditing) {
                const leagueId = extractIdFromLink(currentLeague);
                const response = await axios.put(
                    `http://localhost:8080/api/leagues/${leagueId}`, 
                    currentLeague,
                    
                );
                if (response.status === 200 || response.status === 204) {
                    await fetchLeagues();
                    setIsDialogOpen(false);
                    setCurrentLeague({ name: '' });
                    setIsEditing(false);
                }
            } else {
                const response = await axios.post(
                    'http://localhost:8080/api/leagues', 
                    currentLeague,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    }
                );
                if (response.status === 201 || response.status === 200) {
                    await fetchLeagues();
                    setIsDialogOpen(false);
                    setCurrentLeague({ name: '' });
                }
            }
            setError(null);
        } catch (err) {
            setError(isEditing ? 'Error updating league' : 'Error creating league');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (league) => {
        if (window.confirm('Are you sure you want to delete this league?')) {
            setLoading(true);
            try {
                const leagueId = extractIdFromLink(league); // 'undefined ID' error deleting without this. 
                if (!leagueId) {
                    throw new Error('Could not find league ID');
                }
                const response = await axios.delete(
                    `http://localhost:8080/api/leagues/${leagueId}`,
                );
                if (response.status === 200 || response.status === 204) {
                    await fetchLeagues();
                    setError(null);
                }
            } catch (err) {
                setError('Error deleting league');
            } finally {
                setLoading(false);
            }
        }
    };

    const openEditDialog = (league) => {
        setCurrentLeague({
            ...league,
            id: extractIdFromLink(league)  // ' undefined ID' error editing without this
        });
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const openCreateDialog = () => {
        setCurrentLeague({ name: '' });
        setIsEditing(false);
        setIsDialogOpen(true);
    };


    if (loading) return <p>Loading leagues...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className = "soccerTables">
            <h1>Leagues</h1>
            <button className="action-button" onClick={openCreateDialog}>Add League</button>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {leagues.map((league, index) => (
                        <React.Fragment key={index}>
                            <tr>
                                <td>{league.name}</td>
                                <td>
                                <button className="action-button" onClick={() => openEditDialog(league)}>Edit</button>
                                <button className="action-button" onClick={() => handleDelete(league)}>Delete</button>
                            </td>
                            </tr>
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
            {isDialogOpen && (
                <div>
                    <h2>{isEditing ? 'Edit League' : 'Create New League'}</h2>
                    <form onSubmit={handleSubmit}>
                        <label>
                            Enter new League name:&nbsp;
                            <input
                                value={currentLeague.name}
                                onChange={(e) => setCurrentLeague({ ...currentLeague, name: e.target.value })}
                            />
                        </label>
                        <button className="action-button">{isEditing ? 'Update' : 'Create'}</button>
                        <button className="action-button" onClick={() => setIsDialogOpen(false)}>Cancel</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default LeagueTable;


